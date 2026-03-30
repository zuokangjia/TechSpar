"""Direction Predictor — 预测 HR 接下来的追问方向。"""
import json
import asyncio
import logging

from langchain_core.messages import SystemMessage, HumanMessage

from backend.llm_provider import get_copilot_llm
from backend.copilot.strategy_tree import StrategyTreeNavigator

logger = logging.getLogger("uvicorn")

_PREDICT_PROMPT = """你是一个面试策略分析师。根据当前面试对话和 HR 的考察维度，预测 HR 接下来最可能的 2-3 个追问方向。

当前 HR 考察维度: {topic}
候选人最近的对话:
{recent_conversation}

可能的追问方向:
{children_info}

为每个方向评估概率(0-1)，按可能性降序排列。
输出严格 JSON 数组: [{{"node_id": str, "direction": str, "probability": float}}]
只输出 JSON，不要其他内容。"""

_FREEFORM_PROMPT = """你是一个面试策略分析师。根据当前面试对话，预测 HR 接下来最可能的 2-3 个追问方向。

当前对话:
{recent_conversation}

预测 HR 接下来可能会问什么方向。
输出严格 JSON 数组: [{{"node_id": null, "direction": str, "probability": float}}]
只输出 JSON，不要其他内容。"""

_CORRECTION_BLOCK = """

## 上一轮预测反馈
上一句 HR 说: "{previous_utterance}"
我的预测: {predicted_directions}
实际走向: {actual_direction}
预测结果: {result_text}
请根据此反馈调整本轮预测的概率分布，避免重复同类偏差。"""


async def predict_directions(
    navigator: StrategyTreeNavigator,
    node_id: str | None,
    conversation: list[dict],
    timeout: float = 2.0,
    correction: dict | None = None,
) -> list[dict]:
    """预测追问方向。有策略树子节点时做排序，没有时自由预测。"""
    recent = _format_recent(conversation, max_turns=4)

    if node_id:
        children = navigator.get_children(node_id)
        node = navigator.get_node(node_id)
        topic = node.get("topic", "") if node else ""

        if children:
            children_info = json.dumps([
                {"node_id": c["id"], "direction": c["topic"], "trigger": c.get("trigger_condition", "")}
                for c in children
            ], ensure_ascii=False)
            prompt = _PREDICT_PROMPT.format(
                topic=topic, recent_conversation=recent, children_info=children_info,
            )
        else:
            prompt = _FREEFORM_PROMPT.format(recent_conversation=recent)
    else:
        prompt = _FREEFORM_PROMPT.format(recent_conversation=recent)

    if correction:
        result_text = (
            f"命中「{correction['hit_direction']}」"
            if correction["was_hit"]
            else "未命中，实际方向偏离了预测"
        )
        prompt += _CORRECTION_BLOCK.format(
            previous_utterance=correction["previous_utterance"],
            predicted_directions="、".join(correction["predicted_directions"]),
            actual_direction=correction["actual_direction"],
            result_text=result_text,
        )

    llm = get_copilot_llm()
    try:
        resp = await asyncio.wait_for(
            llm.ainvoke([SystemMessage(content="只输出 JSON"), HumanMessage(content=prompt)]),
            timeout=timeout,
        )
        return _parse_predictions(resp.content)
    except asyncio.TimeoutError:
        logger.warning("Direction prediction timed out, returning tree children")
        if node_id:
            children = navigator.get_children(node_id)
            return [
                {"node_id": c["id"], "direction": c["topic"], "probability": 0.5}
                for c in children[:3]
            ]
        return []
    except Exception as e:
        logger.error(f"Direction prediction failed: {e}")
        return []


def _format_recent(conversation: list[dict], max_turns: int = 4) -> str:
    recent = conversation[-max_turns:] if len(conversation) > max_turns else conversation
    lines = []
    for msg in recent:
        role = "HR" if msg.get("role") == "hr" else "候选人"
        lines.append(f"{role}: {msg.get('text', '')}")
    return "\n".join(lines)


def _parse_predictions(raw: str) -> list[dict]:
    try:
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
        result = json.loads(text)
        if isinstance(result, list):
            return result[:3]
    except (json.JSONDecodeError, TypeError):
        logger.warning(f"Failed to parse predictions: {raw[:200]}")
    return []
