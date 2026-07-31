"use client";

import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { mapCsvRows, type MappedImportRow } from "@/lib/csv-import";
import { INDUSTRY_LABELS, TEAM_MEMBER_LABELS } from "@/lib/status-config";

const PREVIEW_ROWS = 6;

export function ImportExportView({ owners }: { owners: string[] }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [mappedRows, setMappedRows] = useState<MappedImportRow[]>([]);
  const [skippedEmptyCount, setSkippedEmptyCount] = useState(0);
  const [defaultOwner, setDefaultOwner] = useState(owners[0] ?? "");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; duplicates: number; skippedEmpty: number } | null>(
    null
  );

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const [headerRow, ...dataRows] = results.data;
        if (!headerRow) {
          toast.error("Could not read a header row from this file");
          return;
        }
        const { rows, skippedEmpty } = mapCsvRows(headerRow, dataRows);
        if (rows.length === 0) {
          toast.error(
            skippedEmpty > 0
              ? "Every row in this file was completely empty — nothing to import"
              : "No rows found in this file"
          );
        }
        setMappedRows(rows);
        setSkippedEmptyCount(skippedEmpty);
      },
      error: () => toast.error("Failed to parse CSV file"),
    });
  }

  async function handleImport() {
    if (mappedRows.length === 0) return;
    if (!defaultOwner) {
      toast.error("Choose a default contact owner for rows without one");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: mappedRows, defaultOwner }),
      });
      if (!res.ok) throw new Error("Import failed");
      const data = await res.json();
      setResult({ imported: data.imported, duplicates: data.skipped, skippedEmpty: skippedEmptyCount });
      toast.success(`Imported ${data.imported} contact(s)`);
      setMappedRows([]);
      setSkippedEmptyCount(0);
      setFileName(null);
    } catch {
      toast.error("Failed to import contacts");
    } finally {
      setImporting(false);
    }
  }

  function handleExportAll() {
    window.location.href = "/api/contacts/export";
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Download all contacts as a CSV with clean headers, including phone and LinkedIn URL.
            (To export only selected contacts, use the Export button on the Contacts table.)
          </p>
          <Button onClick={handleExportAll}>
            <Download className="size-4" />
            Export all contacts
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Import</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV. Common header variants are auto-detected (Name vs. First/Last Name,
            Email vs. &quot;Email Address&quot;/&quot;Work Email&quot;, Company vs. &quot;Company
            Name&quot;, Industry).
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="text-sm"
            />
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>

          {mappedRows.length > 0 && (
            <>
              <div>
                <Label>Default contact owner (used when a row has no owner column)</Label>
                <Select value={defaultOwner} onValueChange={setDefaultOwner}>
                  <SelectTrigger className="mt-1.5 w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {owners.map((owner) => (
                      <SelectItem key={owner} value={owner}>
                        {TEAM_MEMBER_LABELS[owner as keyof typeof TEAM_MEMBER_LABELS]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">
                  Preview (first {Math.min(PREVIEW_ROWS, mappedRows.length)} of {mappedRows.length}{" "}
                  rows)
                  {skippedEmptyCount > 0 && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      — {skippedEmptyCount} completely empty row{skippedEmptyCount === 1 ? "" : "s"} will be
                      skipped
                    </span>
                  )}
                </p>
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Work Phone</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Industry</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappedRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.firstName}</TableCell>
                          <TableCell>{row.lastName}</TableCell>
                          <TableCell>{row.email || "—"}</TableCell>
                          <TableCell>{row.workPhone}</TableCell>
                          <TableCell>{row.company}</TableCell>
                          <TableCell>{INDUSTRY_LABELS[row.industry]}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <Button onClick={handleImport} disabled={importing}>
                  <Upload className="size-4" />
                  {importing ? "Importing..." : `Import ${mappedRows.length} contact(s)`}
                </Button>
              </div>
            </>
          )}

          {result && (
            <p className="text-sm text-muted-foreground">
              {result.imported} row{result.imported === 1 ? "" : "s"} imported successfully
              {result.duplicates > 0 ? `, ${result.duplicates} skipped (duplicate email)` : ""}
              {result.skippedEmpty > 0 ? `, ${result.skippedEmpty} skipped (completely empty)` : ""}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
