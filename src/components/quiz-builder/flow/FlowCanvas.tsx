import { useState, useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Panel,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { GitBranch, LayoutGrid, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import StepNode from "./StepNode";
import ConditionModal from "./ConditionModal";

interface QuizStep {
  id: string;
  name: string;
  order_index: number;
  step_type: string;
  position_x: number;
  position_y: number;
}

interface QuizConnection {
  id: string;
  source_step_id: string;
  target_step_id: string;
  condition: any;
  is_default: boolean;
}

interface FlowCanvasProps {
  quizId: string;
  steps: QuizStep[];
  connections: QuizConnection[];
  onRefresh: () => void;
}

const nodeTypes = {
  step: StepNode,
};

export default function FlowCanvas({ quizId, steps, connections, onRefresh }: FlowCanvasProps) {
  const { fitView } = useReactFlow();
  const [saving, setSaving] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<QuizConnection | null>(null);
  const [conditionModalOpen, setConditionModalOpen] = useState(false);

  // Convert steps to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return steps.map((step, index) => ({
      id: step.id,
      type: "step",
      position: {
        x: step.position_x || 250,
        y: step.position_y || index * 150,
      },
      data: {
        name: step.name,
        stepType: step.step_type,
        orderIndex: step.order_index,
        isStart: index === 0,
      },
    }));
  }, [steps]);

  // Convert connections to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return connections.map((conn) => ({
      id: conn.id,
      source: conn.source_step_id,
      target: conn.target_step_id,
      type: "smoothstep",
      animated: !conn.is_default,
      style: {
        stroke: conn.is_default ? "hsl(var(--primary))" : "hsl(var(--chart-2))",
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: conn.is_default ? "hsl(var(--primary))" : "hsl(var(--chart-2))",
      },
      label: conn.condition?.value ? `Se: ${conn.condition.value}` : undefined,
      labelStyle: {
        fill: "hsl(var(--foreground))",
        fontSize: 11,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: "hsl(var(--card))",
        fillOpacity: 0.9,
      },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
      data: conn,
    }));
  }, [connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when data changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle new connection
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Check if connection already exists
      const exists = connections.some(
        (c) => c.source_step_id === connection.source && c.target_step_id === connection.target
      );

      if (exists) {
        toast.error("Conexão já existe");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("quiz_connections")
          .insert({
            quiz_id: quizId,
            source_step_id: connection.source,
            target_step_id: connection.target,
            is_default: true,
          })
          .select()
          .single();

        if (error) throw error;

        const newEdge: Edge = {
          id: data.id,
          source: connection.source,
          target: connection.target,
          type: "smoothstep",
          animated: false,
          style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
          data,
        };

        setEdges((eds) => addEdge(newEdge, eds));
        toast.success("Conexão criada!");
        onRefresh();
      } catch (error: any) {
        console.error("Error creating connection:", error);
        toast.error("Erro ao criar conexão");
      }
    },
    [quizId, connections, setEdges, onRefresh]
  );

  // Handle edge click to edit condition
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const conn = connections.find((c) => c.id === edge.id);
      if (conn) {
        setSelectedConnection(conn);
        setConditionModalOpen(true);
      }
    },
    [connections]
  );

  // Save node positions
  const handleSavePositions = useCallback(async () => {
    setSaving(true);
    try {
      const updates = nodes.map((node) => ({
        id: node.id,
        position_x: node.position.x,
        position_y: node.position.y,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("quiz_steps")
          .update({ position_x: update.position_x, position_y: update.position_y })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast.success("Posições salvas!");
    } catch (error: any) {
      console.error("Error saving positions:", error);
      toast.error("Erro ao salvar posições");
    } finally {
      setSaving(false);
    }
  }, [nodes]);

  // Auto-layout nodes
  const handleAutoLayout = useCallback(() => {
    const sortedNodes = [...nodes].sort((a, b) => a.data.orderIndex - b.data.orderIndex);
    const spacing = { x: 300, y: 150 };
    const columns = 3;

    const layoutedNodes = sortedNodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % columns) * spacing.x + 50,
        y: Math.floor(index / columns) * spacing.y + 50,
      },
    }));

    setNodes(layoutedNodes);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [nodes, setNodes, fitView]);

  const sourceStepName = steps.find((s) => s.id === selectedConnection?.source_step_id)?.name || "";
  const targetStepName = steps.find((s) => s.id === selectedConnection?.target_step_id)?.name || "";

  return (
    <>
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { strokeWidth: 2 },
          }}
          className="bg-background"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground) / 0.2)" />
          
          <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted" />
          
          <MiniMap
            className="!bg-card !border-border"
            nodeColor="hsl(var(--primary))"
            maskColor="hsl(var(--background) / 0.8)"
          />

          <Panel position="top-left" className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm">
              <GitBranch className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Editor de Fluxo</span>
            </div>
          </Panel>

          <Panel position="top-right" className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoLayout}
              className="shadow-sm"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Auto Layout
            </Button>
            <Button
              size="sm"
              onClick={handleSavePositions}
              disabled={saving}
              className="shadow-sm"
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Salvando..." : "Salvar Posições"}
            </Button>
          </Panel>

          <Panel position="bottom-left">
            <div className="bg-card border rounded-lg p-3 shadow-sm text-xs space-y-1.5">
              <p className="font-medium mb-2">Dicas:</p>
              <p className="text-muted-foreground">• Arraste os nodes para reorganizar</p>
              <p className="text-muted-foreground">• Conecte nodes arrastando de um ponto ao outro</p>
              <p className="text-muted-foreground">• Clique em uma conexão para configurar condições</p>
              <div className="flex items-center gap-3 mt-2 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-primary rounded" />
                  <span className="text-muted-foreground">Padrão</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-chart-2 rounded animate-pulse" />
                  <span className="text-muted-foreground">Condicional</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <ConditionModal
        open={conditionModalOpen}
        onClose={() => {
          setConditionModalOpen(false);
          setSelectedConnection(null);
        }}
        connection={selectedConnection}
        sourceStepName={sourceStepName}
        targetStepName={targetStepName}
        onUpdate={onRefresh}
        onDelete={onRefresh}
      />
    </>
  );
}
