import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Scan } from "@/lib/types";
import { ScanReportDialog } from "./ScanReportDialog";
import { getStatusColor } from "@/lib/utils";

interface RecentScansHistoryProps {
  scans: Scan[];
  selectedScan: Scan | null;
  setSelectedScan: (scan: Scan | null) => void;
}

export function RecentScansHistory({ scans, selectedScan, setSelectedScan }: RecentScansHistoryProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Histórico Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alvo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.slice(0, 5).map((scan) => (
              <TableRow key={scan.id}>
                <TableCell className="font-medium truncate max-w-37.5">
                  {scan.target}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusColor(scan.status) as any}
                    className="text-[10px]"
                  >
                    {scan.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ScanReportDialog
                    scan={scan}
                    selectedScan={selectedScan}
                    setSelectedScan={setSelectedScan}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
