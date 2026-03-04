import React, { useState, useEffect } from 'react';
import {
  Terminal,
  ShieldCheck,
  Settings,
  ArrowRightLeft,
  Copy,
  Download,
  EyeOff,
  Wand2,
  FileJson,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { parseSqlTable, convertToCSV, convertToJSON, convertToMarkdown, convertToSQL, ParsedData } from './utils/parser';

type ExportFormat = 'CSV' | 'JSON' | 'Markdown' | 'SQL';

export default function App() {
  const [input, setInput] = useState<string>(`+----+-------+----------+
| id | name  | role     |
+----+-------+----------+
| 1  | Alice | Admin    |
| 2  | Bob   | Editor   |
+----+-------+----------+`);
  const [format, setFormat] = useState<ExportFormat>('CSV');
  const [parsedData, setParsedData] = useState<ParsedData>({ headers: [], rows: [] });
  const [copied, setCopied] = useState(false);

  const [tableName, setTableName] = useState('');

  useEffect(() => {
    const data = parseSqlTable(input);
    setParsedData(data);
    setTableName(''); // Clear table name when input changes
  }, [input]);

  const handleCopy = () => {
    let text = '';
    switch (format) {
      case 'CSV': text = convertToCSV(parsedData); break;
      case 'JSON': text = convertToJSON(parsedData); break;
      case 'Markdown': text = convertToMarkdown(parsedData); break;
      case 'SQL': text = convertToSQL(parsedData, tableName || 'converted_table'); break;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let text = '';
    let ext = '';
    switch (format) {
      case 'CSV': text = convertToCSV(parsedData); ext = 'csv'; break;
      case 'JSON': text = convertToJSON(parsedData); ext = 'json'; break;
      case 'Markdown': text = convertToMarkdown(parsedData); ext = 'md'; break;
      case 'SQL': text = convertToSQL(parsedData, tableName || 'converted_table'); ext = 'sql'; break;
    }
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_sql_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-sky-100 p-2 rounded-lg">
            <Terminal className="text-sky-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-slate-900 text-lg font-bold leading-tight tracking-tight">SQL Terminal Converter</h1>
            <p className="text-xs text-slate-500">v1.0.0 • Local Processing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-full">
            <ShieldCheck className="text-sky-600 w-4 h-4" />
            <span className="text-sky-600 text-[10px] font-bold uppercase tracking-wider">Local Only</span>
          </div>
          {/* <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 hover:bg-slate-200 transition-colors">
            <Settings className="text-slate-600 w-5 h-5" />
          </button> */}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Input Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="text-sky-600 w-5 h-5" />
                <h3 className="font-bold text-lg">Input Terminal Output</h3>
              </div>
              {/* <div className="flex bg-slate-200 p-1 rounded-lg">
                <button className="px-3 py-1 text-xs font-medium rounded bg-white text-slate-900 shadow-sm">MySQL</button>
                <button className="px-3 py-1 text-xs font-medium rounded text-slate-500 hover:text-slate-900 transition-colors">PostgreSQL</button>
              </div> */}
            </div>
            <div className="relative flex-1 group min-h-[400px]">
              <textarea
                className="code-font w-full h-full p-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-800 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none resize-none text-sm leading-relaxed"
                placeholder="+----+-------+----------+
| id | name  | role     |
+----+-------+----------+
| 1  | Alice | Admin    |
| 2  | Bob   | Editor   |
+----+-------+----------+"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="absolute bottom-4 right-4 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                <span className="bg-sky-100 text-sky-600 px-3 py-1 rounded text-[10px] font-bold uppercase">Auto-detecting...</span>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="text-sky-600 w-5 h-5 rotate-180" />
                <h3 className="font-bold text-lg">Converted Result</h3>
              </div>
              <div className="flex items-center gap-3">
                {format === 'SQL' && (
                  <input
                    type="text"
                    placeholder="Table name"
                    className="bg-slate-100 border-none rounded-lg text-xs font-bold focus:ring-sky-500 py-2 px-3 outline-none w-32"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                  />
                )}
                <div className="relative">
                  <select
                    className="appearance-none bg-slate-100 border-none rounded-lg text-xs font-bold focus:ring-sky-500 py-2 pl-3 pr-10 cursor-pointer"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  >
                    <option value="CSV">CSV Format</option>
                    <option value="JSON">JSON Array</option>
                    <option value="Markdown">Markdown Table</option>
                    <option value="SQL">SQL Inserts</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[400px]">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-sky-100 hover:text-sky-600 transition-all text-xs font-bold"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-all text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>

              {/* Data Preview */}
              <div className="flex-1 overflow-auto bg-slate-50">
                {parsedData.headers.length > 0 ? (
                  format === 'CSV' ? (
                    <table className="w-full text-left border-collapse text-sm bg-white">
                      <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm shadow-sm">
                        <tr>
                          {parsedData.headers.map((header) => (
                            <th key={header} className="p-3 border-b border-slate-200 font-bold text-sky-600">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="code-font">
                        {parsedData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            {parsedData.headers.map((header) => (
                              <td key={header} className="p-3 border-b border-slate-100 text-slate-700">
                                {row[header]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 min-w-max">
                      <pre className="code-font text-sm text-slate-800 leading-relaxed">
                        {format === 'JSON' && convertToJSON(parsedData)}
                        {format === 'Markdown' && convertToMarkdown(parsedData)}
                        {format === 'SQL' && convertToSQL(parsedData, tableName || 'converted_table')}
                      </pre>
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 p-10 text-center">
                    <EyeOff className="w-12 h-12 opacity-20" />
                    <p className="text-sm">No valid SQL table detected.<br />Paste your terminal output on the left.</p>
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className="p-2 px-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  {parsedData.rows.length} rows parsed successfully
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
                  <span className="text-[10px] text-sky-600 font-bold uppercase">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm"
          >
            <EyeOff className="text-sky-600 mb-3 w-6 h-6" />
            <h4 className="font-bold text-slate-900 mb-1">Zero Server Calls</h4>
            <p className="text-sm text-slate-600 leading-relaxed">Your data never leaves your browser. Parsing is performed 100% locally in your machine.</p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm"
          >
            <Wand2 className="text-sky-600 mb-3 w-6 h-6" />
            <h4 className="font-bold text-slate-900 mb-1">Smart Auto-Detection</h4>
            <p className="text-sm text-slate-600 leading-relaxed">Intelligently detects borders, headers, and null values from common SQL terminal outputs.</p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm"
          >
            <FileJson className="text-sky-600 mb-3 w-6 h-6" />
            <h4 className="font-bold text-slate-900 mb-1">Multiple Formats</h4>
            <p className="text-sm text-slate-600 leading-relaxed">Easily export your data to CSV, JSON, Markdown, or SQL Inserts formatted perfectly for your needs.</p>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} SQL Terminal Converter. Built for developers with privacy in mind.
        </p>
      </footer>
    </div>
  );
}
