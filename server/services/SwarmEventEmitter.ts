import { EventEmitter } from "events";

export interface AgentThought {
  agentId: string;
  traceId: string;
  type: "thinking" | "response" | "critique" | "refined";
  content: string;
  confidence?: number;
  timestamp: number;
}

export interface SwarmEvent {
  traceId: string;
  type:
    | "agent_start"
    | "agent_thought"
    | "agent_complete"
    | "critique_start"
    | "critique_complete"
    | "synthesis_start"
    | "synthesis_complete"
    | "consensus_update";
  data: Record<string, unknown>;
  timestamp: number;
}

class SwarmEventEmitterClass extends EventEmitter {
  private static instance: SwarmEventEmitterClass;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance(): SwarmEventEmitterClass {
    if (!SwarmEventEmitterClass.instance) {
      SwarmEventEmitterClass.instance = new SwarmEventEmitterClass();
    }
    return SwarmEventEmitterClass.instance;
  }

  emitThought(thought: AgentThought): void {
    this.emit(`thought:${thought.traceId}`, thought);
    this.emit("thought", thought);
  }

  emitSwarmEvent(event: SwarmEvent): void {
    this.emit(`swarm:${event.traceId}`, event);
    this.emit("swarm", event);
  }

  subscribeToTrace(
    traceId: string,
    callback: (event: SwarmEvent) => void,
  ): () => void {
    const handler = (event: SwarmEvent) => callback(event);
    this.on(`swarm:${traceId}`, handler);
    return () => this.off(`swarm:${traceId}`, handler);
  }

  subscribeToThoughts(
    traceId: string,
    callback: (thought: AgentThought) => void,
  ): () => void {
    const handler = (thought: AgentThought) => callback(thought);
    this.on(`thought:${traceId}`, handler);
    return () => this.off(`thought:${traceId}`, handler);
  }
}

export const swarmEventEmitter = SwarmEventEmitterClass.getInstance();
