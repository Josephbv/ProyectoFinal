import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Download, Eye, Calendar, Filter } from "lucide-react";

const reportData = [
  {
    date: "2024-01-24",
    visibility: 84,
    presence: 74,
    mentions: 298,
    rank: 2.1
  },
  {
    date: "2024-01-23",
    visibility: 86,
    presence: 72,
    mentions: 312,
    rank: 2.3
  },
  {
    date: "2024-01-22",
    visibility: 81,
    presence: 76,
    mentions: 289,
    rank: 2.0
  },
  {
    date: "2024-01-21",
    visibility: 78,
    presence: 73,
    mentions: 234,
    rank: 2.4
  },
  {
    date: "2024-01-20",
    visibility: 75,
    presence: 69,
    mentions: 178,
    rank: 2.7
  },
  {
    date: "2024-01-19",
    visibility: 72,
    presence: 71,
    mentions: 203,
    rank: 2.5
  },
  {
    date: "2024-01-18",
    visibility: 68,
    presence: 68,
    mentions: 156,
    rank: 2.9
  },
];

export function ReportsPage() {
  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Reports</h1>
            <p className="text-sm text-dark-secondary mt-1">Export and analyze your LLM visibility data</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="gap-2 border-dark-color text-dark-secondary hover:bg-dark-hover">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button size="sm" className="gap-2 bg-dark-cta hover:bg-blue-600 text-white">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="dark-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-dark-primary mb-1">7</div>
              <div className="text-sm text-dark-secondary">Days Analyzed</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">1,970</div>
              <div className="text-sm text-dark-secondary">Total Mentions</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">77%</div>
              <div className="text-sm text-dark-secondary">Avg Visibility</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">71%</div>
              <div className="text-sm text-dark-secondary">Avg Presence</div>
            </CardContent>
          </Card>
        </div>

        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-dark-primary">Daily Performance Report</CardTitle>
            <CardDescription className="text-dark-secondary">
              Detailed daily metrics for LLM visibility and presence tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-dark-color">
                  <TableHead className="font-semibold text-dark-primary">Date</TableHead>
                  <TableHead className="font-semibold text-dark-primary">Visibility %</TableHead>
                  <TableHead className="font-semibold text-dark-primary">Presence %</TableHead>
                  <TableHead className="font-semibold text-dark-primary">Mentions</TableHead>
                  <TableHead className="font-semibold text-dark-primary">Avg Rank</TableHead>
                  <TableHead className="font-semibold text-dark-primary">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row, index) => (
                  <TableRow
                    key={row.date}
                    className="border-dark-color hover:bg-dark-table-hover transition-colors"
                  >
                    <TableCell className="font-medium text-dark-primary">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-dark-secondary" />
                        <span>{new Date(row.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-2 bg-dark-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${row.visibility}%` }}
                          />
                        </div>
                        <span className="font-medium text-dark-primary">{row.visibility}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-2 bg-dark-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${row.presence}%` }}
                          />
                        </div>
                        <span className="font-medium text-dark-primary">{row.presence}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="font-medium bg-dark-hover text-dark-primary border-dark-color">
                        {row.mentions}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${row.rank <= 2.5 ? 'text-green-400' : 'text-amber-400'}`}>
                        {row.rank}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="gap-2 border-dark-color text-dark-secondary hover:bg-dark-hover">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
