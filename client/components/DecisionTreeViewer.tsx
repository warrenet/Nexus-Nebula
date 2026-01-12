import React, { useCallback, useMemo, useState } from "react";
// eslint-disable-next-line import/no-named-as-default
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";

interface AgentResponse {
  agentId: string;
  model: string;
  response: string;
  confidence: number;
  latencyMs: number;
}

interface Iteration {
  iterationId: number;
  agentResponses: AgentResponse[];
  consensusScore: number;
  timestamp: string;
}

interface Trace {
  traceId: string;
  mission: string;
  iterations: Iteration[];
  finalPosteriorWeights: Record<string, number>;
  synthesisResult?: string;
}

interface DecisionTreeViewerProps {
  trace: Trace;
  onAgentSelect?: (agentId: string, response: AgentResponse) => void;
}

// Custom node styles
const nodeStyles = {
  mission: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "2px solid #8B5CF6",
    borderRadius: "12px",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: "bold",
    boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)",
  },
  iteration: {
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    color: "#06B6D4",
    border: "2px solid #06B6D4",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "12px",
    boxShadow: "0 2px 10px rgba(6, 182, 212, 0.2)",
  },
  agent: {
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
    color: "#E5E5E5",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "11px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  synthesis: {
    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    color: "white",
    border: "2px solid #10B981",
    borderRadius: "12px",
    padding: "12px 20px",
    fontSize: "13px",
    fontWeight: "bold",
    boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
  },
} as const;

/**
 * DecisionTreeViewer - Interactive Decision Explorer using react-flow
 * Per 2026 Sovereign Spec: Click branch to see Reasoning Monologue
 */
export function DecisionTreeViewer({
  trace,
  onAgentSelect,
}: DecisionTreeViewerProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentResponse | null>(
    null,
  );

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Root node - Mission
    nodes.push({
      id: "mission",
      type: "default",
      position: { x: 400, y: 0 },
      data: {
        label: `🎯 ${trace.mission.substring(0, 50)}${trace.mission.length > 50 ? "..." : ""}`,
      },
      style: nodeStyles.mission,
    });

    let yOffset = 120;

    // Iteration nodes
    trace.iterations.forEach((iteration, iterIdx) => {
      const iterNodeId = `iter-${iteration.iterationId}`;

      nodes.push({
        id: iterNodeId,
        type: "default",
        position: { x: 400, y: yOffset },
        data: {
          label: `📊 Round ${iteration.iterationId} | Consensus: ${(iteration.consensusScore * 100).toFixed(1)}%`,
        },
        style: nodeStyles.iteration,
      });

      // Connect to previous node
      const sourceId =
        iterIdx === 0
          ? "mission"
          : `iter-${trace.iterations[iterIdx - 1].iterationId}`;
      edges.push({
        id: `edge-${sourceId}-${iterNodeId}`,
        source: sourceId,
        target: iterNodeId,
        animated: true,
        style: { stroke: "#06B6D4", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#06B6D4" },
      });

      yOffset += 100;

      // Agent nodes for this iteration
      const agentCount = iteration.agentResponses.length;
      const agentSpacing = 180;
      const startX = 400 - ((agentCount - 1) * agentSpacing) / 2;

      iteration.agentResponses.forEach((agent, agentIdx) => {
        const agentNodeId = `agent-${iteration.iterationId}-${agent.agentId}`;
        const weight = trace.finalPosteriorWeights[agent.agentId] || 0;
        const confidenceColor =
          agent.confidence > 0.8
            ? "#10B981"
            : agent.confidence > 0.5
              ? "#F59E0B"
              : "#EF4444";

        nodes.push({
          id: agentNodeId,
          type: "default",
          position: { x: startX + agentIdx * agentSpacing, y: yOffset },
          data: {
            label: `🤖 ${agent.agentId}\n${(agent.confidence * 100).toFixed(0)}% | W: ${(weight * 100).toFixed(0)}%`,
            agent,
          },
          style: {
            ...nodeStyles.agent,
            borderColor: confidenceColor,
          },
        });

        edges.push({
          id: `edge-${iterNodeId}-${agentNodeId}`,
          source: iterNodeId,
          target: agentNodeId,
          style: {
            stroke: confidenceColor,
            strokeWidth: Math.max(1, weight * 5),
            opacity: 0.6,
          },
        });
      });

      yOffset += 120;
    });

    // Synthesis node
    if (trace.synthesisResult) {
      const synthNodeId = "synthesis";
      nodes.push({
        id: synthNodeId,
        type: "default",
        position: { x: 400, y: yOffset },
        data: {
          label: `✨ Synthesis Complete\n${trace.synthesisResult.substring(0, 60)}...`,
        },
        style: nodeStyles.synthesis,
      });

      // Connect last iteration to synthesis
      if (trace.iterations.length > 0) {
        const lastIterNodeId = `iter-${trace.iterations[trace.iterations.length - 1].iterationId}`;
        edges.push({
          id: `edge-${lastIterNodeId}-${synthNodeId}`,
          source: lastIterNodeId,
          target: synthNodeId,
          animated: true,
          style: { stroke: "#10B981", strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#10B981" },
        });
      }
    }

    return { nodes, edges };
  }, [trace]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nodesState, _setNodes, onNodesChange] = useNodesState(nodes);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [edgesState, _setEdges, onEdgesChange] = useEdgesState(edges);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.data.agent) {
        setSelectedAgent(node.data.agent);
        onAgentSelect?.(node.data.agent.agentId, node.data.agent);
      }
    },
    [onAgentSelect],
  );

  return (
    <div
      style={{
        width: "100%",
        height: "600px",
        background: "#0A0A0F",
        borderRadius: "12px",
      }}
    >
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls style={{ background: "#1a1a2e", borderColor: "#333" }} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#333"
        />

        {/* Reasoning Monologue Panel */}
        {selectedAgent && (
          <Panel
            position="top-right"
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)",
              border: "1px solid #8B5CF6",
              borderRadius: "12px",
              padding: "16px",
              maxWidth: "350px",
              color: "white",
              boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", color: "#8B5CF6" }}>
              🧠 Reasoning Monologue
            </h4>
            <p
              style={{
                fontSize: "12px",
                color: "#06B6D4",
                margin: "0 0 8px 0",
              }}
            >
              Agent: {selectedAgent.agentId} | Confidence:{" "}
              {(selectedAgent.confidence * 100).toFixed(1)}%
            </p>
            <div
              style={{
                fontSize: "13px",
                lineHeight: 1.5,
                maxHeight: "200px",
                overflow: "auto",
                padding: "8px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
              }}
            >
              {selectedAgent.response}
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              style={{
                marginTop: "12px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                color: "white",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export default DecisionTreeViewer;
