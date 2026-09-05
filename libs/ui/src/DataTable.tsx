/**
 * Standard DataTable component for TC-Gaming Monorepo.
 * Provides accessible, responsive data tables compatible with ColumnDef structure.
 */
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/table";

export interface ColumnDef<TData, TValue = any> {
  id?: string;
  accessorKey?: keyof TData | string;
  header: React.ReactNode | ((props: { column: any }) => React.ReactNode);
  cell?: (props: { row: { original: TData; getValue: (key: string) => any } }) => React.ReactNode;
}

export interface DataTableProps<TData, TValue = any> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyText?: string;
}

export function DataTable<TData, TValue = any>({
  columns,
  data,
  emptyText = "Không có dữ liệu",
}: DataTableProps<TData, TValue>) {
  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead key={col.id || String(col.accessorKey) || idx}>
                {typeof col.header === "function" ? col.header({ column: col }) : col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {columns.map((col, colIdx) => {
                  const key = String(col.accessorKey || "");
                  const cellContent = col.cell
                    ? col.cell({
                        row: {
                          original: row,
                          getValue: (k: string) => (row as any)?.[k],
                        },
                      })
                    : (row as any)?.[key];
                  return (
                    <TableCell key={col.id || key || colIdx}>
                      {cellContent}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;
