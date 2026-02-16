import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Boxes, Search, RefreshCw, ChevronLeft, ChevronRight, Hash, Clock, Layers } from "lucide-react";

interface BlockRow {
  id: string;
  block_index: number;
  block_hash: string;
  previous_hash: string;
  merkle_root: string;
  nonce: number;
  difficulty: number;
  transaction_count: number;
  created_at: string;
  miner_id: string | null;
  total_fees: number | null;
  block_reward: number | null;
}

interface AuditLogRow {
  id: string;
  transaction_id: string;
  user_id: string;
  action: string;
  resource: string;
  block_hash: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  gas_used: number | null;
}

const PAGE_SIZE = 20;

export default function BlockExplorer() {
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AuditLogRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockRow | null>(null);
  const [blockTxns, setBlockTxns] = useState<AuditLogRow[]>([]);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("blockchain_blocks")
      .select("*", { count: "exact" })
      .order("block_index", { ascending: false })
      .range(from, to);

    if (!error) {
      setBlocks((data || []) as unknown as BlockRow[]);
      setTotalBlocks(count || 0);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);

    // Search by transaction ID, user ID, or action
    const { data, error } = await supabase
      .from("blockchain_audit_logs")
      .select("*")
      .or(
        `transaction_id.ilike.%${searchQuery}%,user_id.ilike.%${searchQuery}%,action.ilike.%${searchQuery}%`
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) {
      setSearchResults((data || []) as unknown as AuditLogRow[]);
    }
    setSearching(false);
  };

  const openBlockDetail = async (block: BlockRow) => {
    setSelectedBlock(block);
    const { data } = await supabase
      .from("blockchain_audit_logs")
      .select("*")
      .eq("block_hash", block.block_hash)
      .order("created_at", { ascending: true });
    setBlockTxns((data || []) as unknown as AuditLogRow[]);
  };

  const totalPages = Math.ceil(totalBlocks / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Boxes className="h-8 w-8 text-primary" /> Block Explorer
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse blocks, search transactions, and verify the audit chain
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBlocks}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chain Height</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> {totalBlocks}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Latest Block</CardDescription>
            <CardTitle className="text-lg font-mono truncate">
              {blocks[0]?.block_hash?.slice(0, 16) || "—"}…
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Latest Difficulty</CardDescription>
            <CardTitle className="text-2xl">{blocks[0]?.difficulty ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="blocks">
        <TabsList>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="search">Transaction Search</TabsTrigger>
        </TabsList>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Height</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead>Prev Hash</TableHead>
                    <TableHead>Txns</TableHead>
                    <TableHead>Nonce</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Mined</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Loading…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && blocks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No blocks found. Mine some blocks first!
                      </TableCell>
                    </TableRow>
                  )}
                  {blocks.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono font-bold">{b.block_index}</TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[120px]">{b.block_hash}</TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[100px]">{b.previous_hash}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{b.transaction_count}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{b.nonce}</TableCell>
                      <TableCell>{b.difficulty}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => openBlockDetail(b)}>
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Hash className="h-5 w-5" /> Block #{selectedBlock?.block_index}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedBlock && (
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-3 text-sm">
                                  <div><span className="font-semibold">Hash:</span> <code className="text-xs break-all">{selectedBlock.block_hash}</code></div>
                                  <div><span className="font-semibold">Previous:</span> <code className="text-xs break-all">{selectedBlock.previous_hash}</code></div>
                                  <div><span className="font-semibold">Merkle Root:</span> <code className="text-xs break-all">{selectedBlock.merkle_root}</code></div>
                                  <div className="flex gap-6">
                                    <div><span className="font-semibold">Nonce:</span> {selectedBlock.nonce}</div>
                                    <div><span className="font-semibold">Difficulty:</span> {selectedBlock.difficulty}</div>
                                    <div><span className="font-semibold">Txns:</span> {selectedBlock.transaction_count}</div>
                                  </div>
                                  <div><span className="font-semibold">Fees:</span> {selectedBlock.total_fees ?? 0} | <span className="font-semibold">Reward:</span> {selectedBlock.block_reward ?? 0}</div>
                                  <div><span className="font-semibold">Miner:</span> {selectedBlock.miner_id?.slice(0, 8) ?? "—"}</div>
                                  <div><span className="font-semibold">Time:</span> {new Date(selectedBlock.created_at).toLocaleString()}</div>

                                  <Separator className="my-3" />
                                  <h4 className="font-semibold">Transactions ({blockTxns.length})</h4>
                                  {blockTxns.length === 0 && <p className="text-muted-foreground text-xs">No transactions in this block</p>}
                                  {blockTxns.map((tx) => (
                                    <div key={tx.id} className="border rounded p-2 text-xs space-y-1">
                                      <div><span className="font-semibold">TX:</span> {tx.transaction_id}</div>
                                      <div><span className="font-semibold">Action:</span> {tx.action} on {tx.resource}</div>
                                      <div><span className="font-semibold">User:</span> {tx.user_id.slice(0, 8)}…</div>
                                      <div><span className="font-semibold">Gas:</span> {tx.gas_used ?? 0}</div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages || 1} ({totalBlocks} blocks)
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by transaction ID, user ID, or action…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="h-4 w-4 mr-1" /> Search
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searching ? "Searching…" : "Enter a query and press Search"}
                      </TableCell>
                    </TableRow>
                  )}
                  {searchResults.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs truncate max-w-[120px]">{tx.transaction_id}</TableCell>
                      <TableCell>{tx.action}</TableCell>
                      <TableCell>{tx.resource}</TableCell>
                      <TableCell className="font-mono text-xs">{tx.user_id.slice(0, 8)}…</TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[80px]">{tx.block_hash?.slice(0, 12) ?? "pending"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
