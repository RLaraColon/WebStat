import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WorksheetData, ColumnDefinition, DataType } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Type,
  Hash,
  Calendar,
  FileSpreadsheet,
  Undo2,
  Redo2
} from 'lucide-react';
import { parseClipboardData } from '../utils/worksheet';

interface WorksheetGridProps {
  worksheet: WorksheetData;
  onUpdateWorksheet: (updated: WorksheetData) => void;
  selectedColumnId?: string | null;
  selectedRowIndex?: number | null;
  onSelectColumn?: (colId: string | null) => void;
  onSelectRow?: (rowIndex: number | null) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const WorksheetGrid: React.FC<WorksheetGridProps> = ({
  worksheet,
  onUpdateWorksheet,
  selectedColumnId = null,
  selectedRowIndex: _selectedRowIndex = null,
  onSelectColumn = (_colId: string | null = null) => {},
  onSelectRow = (_rowIndex: number | null = null) => {},
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo
}) => {
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colId: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingColHeader, setEditingColHeader] = useState<string | null>(null);
  const [headerNameInput, setHeaderNameInput] = useState<string>('');
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Focus input when starting edit
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  const handleCellClick = (rowIndex: number, colId: string) => {
    if (editingCell && (editingCell.rowIndex !== rowIndex || editingCell.colId !== colId)) {
      commitCellEdit();
    }
    setSelectedCell({ rowIndex, colId });
    if (onSelectColumn) onSelectColumn(colId);
    if (onSelectRow) onSelectRow(rowIndex);
  };

  const handleCellDoubleClick = (rowIndex: number, colId: string) => {
    const val = worksheet.rows[rowIndex]?.[colId];
    setEditValue(val !== null && val !== undefined ? String(val) : '');
    setEditingCell({ rowIndex, colId });
  };

  const commitCellEdit = () => {
    if (!editingCell) return;
    const { rowIndex, colId } = editingCell;
    const colDef = worksheet.columns.find(c => c.id === colId);
    
    const trimmed = editValue.trim();
    let parsedVal: string | number | null = trimmed;
    if (trimmed === '') {
      parsedVal = null;
    } else if (colDef?.type === 'numeric') {
      const num = parseFloat(trimmed.replace(',', '.'));
      parsedVal = !isNaN(num) ? num : trimmed;
    }

    const newRows = [...worksheet.rows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [colId]: parsedVal
    };

    onUpdateWorksheet({
      ...worksheet,
      rows: newRows,
      updatedAt: new Date().toISOString()
    });

    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitCellEdit();
        // Move down
        if (editingCell.rowIndex + 1 < worksheet.rows.length) {
          setSelectedCell({ rowIndex: editingCell.rowIndex + 1, colId: editingCell.colId });
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitCellEdit();
        // Move right
        const colIdx = worksheet.columns.findIndex(c => c.id === editingCell.colId);
        if (colIdx + 1 < worksheet.columns.length) {
          setSelectedCell({ rowIndex: editingCell.rowIndex, colId: worksheet.columns[colIdx + 1].id });
        }
      }
      return;
    }

    if (!selectedCell) return;

    const { rowIndex, colId } = selectedCell;
    const colIdx = worksheet.columns.findIndex(c => c.id === colId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIndex + 1 < worksheet.rows.length) {
        setSelectedCell({ rowIndex: rowIndex + 1, colId });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIndex > 0) {
        setSelectedCell({ rowIndex: rowIndex - 1, colId });
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (colIdx + 1 < worksheet.columns.length) {
        setSelectedCell({ rowIndex, colId: worksheet.columns[colIdx + 1].id });
        if (onSelectColumn) onSelectColumn(worksheet.columns[colIdx + 1].id);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (colIdx > 0) {
        setSelectedCell({ rowIndex, colId: worksheet.columns[colIdx - 1].id });
        if (onSelectColumn) onSelectColumn(worksheet.columns[colIdx - 1].id);
      }
    } else if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      handleCellDoubleClick(rowIndex, colId);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      const newRows = [...worksheet.rows];
      newRows[rowIndex] = { ...newRows[rowIndex], [colId]: null };
      onUpdateWorksheet({ ...worksheet, rows: newRows });
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        if (onRedo && canRedo) onRedo();
      } else {
        if (onUndo && canUndo) onUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      if (onRedo && canRedo) onRedo();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Direct typing
      setEditValue(e.key);
      setEditingCell({ rowIndex, colId });
    }
  };

  // Handle Clipboard Paste (e.g. from Excel / Sheets)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text || !selectedCell) return;

    e.preventDefault();
    const { matrix } = parseClipboardData(text);
    if (matrix.length === 0) return;

    const startRow = selectedCell.rowIndex;
    const startColIdx = worksheet.columns.findIndex(c => c.id === selectedCell.colId);
    if (startColIdx === -1) return;

    // Need more rows?
    const requiredRows = startRow + matrix.length;
    let newRows = [...worksheet.rows];
    while (newRows.length < requiredRows) {
      const emptyRow: Record<string, any> = {};
      worksheet.columns.forEach(c => (emptyRow[c.id] = null));
      newRows.push(emptyRow);
    }

    // Need more columns?
    const maxColsPasted = Math.max(...matrix.map(r => r.length));
    const requiredCols = startColIdx + maxColsPasted;
    let newCols = [...worksheet.columns];
    while (newCols.length < requiredCols) {
      const nextId = `C${newCols.length + 1}`;
      newCols.push({
        id: nextId,
        name: `Var_${newCols.length + 1}`,
        type: 'numeric',
        width: 100
      });
    }

    // Populate data
    matrix.forEach((pRow, rOffset) => {
      const targetRowIdx = startRow + rOffset;
      const rowData = { ...newRows[targetRowIdx] };

      pRow.forEach((val, cOffset) => {
        const targetCol = newCols[startColIdx + cOffset];
        if (targetCol) {
          rowData[targetCol.id] = val === '' ? null : val;
        }
      });

      newRows[targetRowIdx] = rowData;
    });

    onUpdateWorksheet({
      ...worksheet,
      columns: newCols,
      rows: newRows,
      updatedAt: new Date().toISOString()
    });
  }, [selectedCell, worksheet, onUpdateWorksheet]);

  // Add column
  const handleAddColumn = () => {
    const nextId = `C${worksheet.columns.length + 1}`;
    const newCol: ColumnDefinition = {
      id: nextId,
      name: `Var_${worksheet.columns.length + 1}`,
      type: 'numeric',
      width: 100
    };
    const newRows = worksheet.rows.map(r => ({ ...r, [nextId]: null }));
    onUpdateWorksheet({
      ...worksheet,
      columns: [...worksheet.columns, newCol],
      rows: newRows
    });
  };

  // Add rows
  const handleAddRows = (count: number = 10) => {
    const extraRows = Array.from({ length: count }, () => {
      const r: Record<string, any> = {};
      worksheet.columns.forEach(c => (r[c.id] = null));
      return r;
    });
    onUpdateWorksheet({
      ...worksheet,
      rows: [...worksheet.rows, ...extraRows]
    });
  };

  // Rename column header
  const handleStartEditHeader = (col: ColumnDefinition) => {
    setEditingColHeader(col.id);
    setHeaderNameInput(col.name);
  };

  const handleSaveHeader = (colId: string) => {
    const trimmed = headerNameInput.trim() || colId;
    const newCols = worksheet.columns.map(c => (c.id === colId ? { ...c, name: trimmed } : c));
    onUpdateWorksheet({ ...worksheet, columns: newCols });
    setEditingColHeader(null);
  };

  // Toggle column data type
  const handleToggleColType = (colId: string) => {
    const newCols = worksheet.columns.map(c => {
      if (c.id === colId) {
        const nextType: DataType = c.type === 'numeric' ? 'text' : c.type === 'text' ? 'date' : 'numeric';
        return { ...c, type: nextType };
      }
      return c;
    });
    onUpdateWorksheet({ ...worksheet, columns: newCols });
  };

  // Delete Column
  const handleDeleteColumn = (colId: string) => {
    if (worksheet.columns.length <= 1) return;
    const newCols = worksheet.columns.filter(c => c.id !== colId);
    const newRows = worksheet.rows.map(r => {
      const copy = { ...r };
      delete copy[colId];
      return copy;
    });
    onUpdateWorksheet({ ...worksheet, columns: newCols, rows: newRows });
    if (selectedColumnId === colId && onSelectColumn) {
      onSelectColumn(null);
    }
  };

  return (
    <div
      id="worksheet-grid-wrapper"
      className="flex flex-col h-full bg-white overflow-hidden select-none"
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      tabIndex={0}
    >
      {/* Grid Subheader (Professional Polish Style) */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-100 border-b border-slate-200 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" />
            <span>Hoja de Trabajo: {worksheet.title}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-[10px]">
            {worksheet.rows.length} Renglones × {worksheet.columns.length} Columnas
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Undo / Redo controls */}
          <div className="flex items-center space-x-0.5 bg-white rounded border border-slate-300 p-0.5 shadow-2xs">
            <button
              disabled={!canUndo}
              onClick={onUndo}
              className={`p-1 rounded text-[11px] font-medium flex items-center space-x-1 transition-colors ${
                canUndo
                  ? 'hover:bg-blue-50 text-slate-700 hover:text-blue-700 cursor-pointer active:scale-95'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Deshacer edición (Ctrl+Z)"
            >
              <Undo2 className="w-3 h-3" />
              <span className="text-[10px] hidden sm:inline">Deshacer</span>
            </button>
            <button
              disabled={!canRedo}
              onClick={onRedo}
              className={`p-1 rounded text-[11px] font-medium flex items-center space-x-1 transition-colors ${
                canRedo
                  ? 'hover:bg-blue-50 text-slate-700 hover:text-blue-700 cursor-pointer active:scale-95'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Rehacer edición (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3 h-3" />
              <span className="text-[10px] hidden sm:inline">Rehacer</span>
            </button>
          </div>

          <button
            onClick={() => handleAddRows(10)}
            className="flex items-center space-x-1 px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 text-[11px] shadow-2xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-blue-600" />
            <span>+10 Renglones</span>
          </button>
          <button
            onClick={handleAddColumn}
            className="flex items-center space-x-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] shadow-2xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>+ Columna</span>
          </button>
        </div>
      </div>

      {/* Grid Table Body */}
      <div
        ref={tableRef}
        className="flex-1 overflow-auto bg-white focus:outline-none"
      >
        <table className="w-full text-xs border-collapse border-slate-200 select-none table-fixed">
          <thead className="sticky top-0 bg-slate-200 z-10">
            {/* Top row: Column IDs (C1, C2, C3, C4...) */}
            <tr>
              <th className="w-10 border border-slate-300 bg-slate-100 py-1 text-slate-400 font-normal italic text-center">
                &nbsp;
              </th>
              {worksheet.columns.map((col) => {
                const isSelected = selectedColumnId === col.id;
                return (
                  <th
                    key={`id-${col.id}`}
                    style={{ width: col.width || 100 }}
                    onClick={() => onSelectColumn && onSelectColumn(col.id)}
                    className={`border border-slate-300 px-2 py-1 font-semibold text-slate-600 cursor-pointer transition-colors text-center ${
                      isSelected ? 'bg-blue-600 text-white' : 'hover:bg-slate-300/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono">{col.id}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleColType(col.id);
                        }}
                        title={`Tipo: ${col.type}. Clic para alternar.`}
                        className={`p-0.5 rounded ${
                          isSelected ? 'hover:bg-blue-700 text-white' : 'hover:bg-slate-300 text-slate-500'
                        }`}
                      >
                        {col.type === 'numeric' ? (
                          <Hash className="w-2.5 h-2.5" />
                        ) : col.type === 'text' ? (
                          <Type className="w-2.5 h-2.5" />
                        ) : (
                          <Calendar className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                  </th>
                );
              })}
              <th className="border border-slate-300 bg-slate-100"></th>
            </tr>

            {/* Second row: Variable Names */}
            <tr className="bg-white">
              <th className="border border-slate-300 bg-slate-50 py-1 text-center text-slate-400 text-[10px]">
                Var
              </th>
              {worksheet.columns.map((col) => {
                const isEditing = editingColHeader === col.id;
                const isSelected = selectedColumnId === col.id;

                return (
                  <th
                    key={`name-${col.id}`}
                    style={{ width: col.width || 100 }}
                    className={`border border-slate-300 px-2 py-1 font-normal group relative text-left ${
                      isSelected ? 'bg-blue-50 text-blue-900' : 'bg-white text-slate-500'
                    }`}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        type="text"
                        value={headerNameInput}
                        onChange={(e) => setHeaderNameInput(e.target.value)}
                        onBlur={() => handleSaveHeader(col.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveHeader(col.id);
                          if (e.key === 'Escape') setEditingColHeader(null);
                        }}
                        className="w-full px-1 py-0.5 text-xs bg-white border border-blue-600 rounded outline-none font-sans text-slate-900"
                      />
                    ) : (
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onDoubleClick={() => handleStartEditHeader(col)}
                        onClick={() => onSelectColumn && onSelectColumn(col.id)}
                      >
                        <span className="uppercase text-[9px] font-semibold truncate max-w-[75px]" title={col.name}>
                          {col.name}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditHeader(col);
                            }}
                            className="p-0.5 text-slate-400 hover:text-blue-600 rounded"
                            title="Renombrar variable"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                          {worksheet.columns.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteColumn(col.id);
                              }}
                              className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                              title="Eliminar columna"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}
              <th className="border border-slate-300 bg-white"></th>
            </tr>
          </thead>

          <tbody>
            {worksheet.rows.map((row, rowIndex) => {
              return (
                <tr key={`row-${rowIndex}`} className="hover:bg-blue-50/50">
                  {/* Row Number */}
                  <td className="bg-slate-100 border border-slate-300 text-center text-slate-400 font-medium py-1 font-mono text-[11px] sticky left-0 z-0">
                    {rowIndex + 1}
                  </td>

                  {/* Data Cells */}
                  {worksheet.columns.map((col) => {
                    const isSelected = selectedCell?.rowIndex === rowIndex && selectedCell?.colId === col.id;
                    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colId === col.id;
                    const isColSelected = selectedColumnId === col.id;
                    const rawVal = row[col.id];
                    const displayVal = rawVal !== null && rawVal !== undefined ? String(rawVal) : '';

                    return (
                      <td
                        key={`cell-${rowIndex}-${col.id}`}
                        onClick={() => handleCellClick(rowIndex, col.id)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, col.id)}
                        className={`border border-slate-200 px-2 py-1 font-mono text-[11.5px] cursor-cell relative truncate text-slate-800 ${
                          isSelected
                            ? 'bg-blue-100 ring-2 ring-blue-600 ring-inset z-10'
                            : isColSelected
                            ? 'bg-blue-50/40'
                            : rowIndex % 2 === 1
                            ? 'bg-slate-50/30'
                            : 'bg-white'
                        } ${col.type === 'numeric' ? 'text-right' : 'text-left'}`}
                      >
                        {isEditing ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitCellEdit}
                            className="absolute inset-0 w-full h-full px-2 py-1 bg-white text-slate-900 border-2 border-blue-600 outline-none font-mono text-[11.5px] z-20"
                          />
                        ) : (
                          <span className={displayVal === '' ? 'text-slate-300' : 'text-slate-800'}>
                            {displayVal}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-slate-200"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
