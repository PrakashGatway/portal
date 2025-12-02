// GMATDataInsightsBlock.tsx
import { Plus, X } from "lucide-react";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import RichTextEditor from "../../components/TextEditor";


export const GMATDataInsightsBlock: React.FC<any> = ({
    isMultiSource,
    isTwoPart,
    isTable,
    isGraphics,
    watch,
    setValue,
    useFieldArray,
    control
}) => {
    // MULTI-SOURCE REASONING
    if (isMultiSource) {
        // Use useFieldArray for statements
        const { fields: msStatements, append: appendMsStatement, remove: removeMsStatement } = useFieldArray({
            name: "dataInsights.multiSource.statements",
            control
        });

        // Use useFieldArray for tabs
        const { fields: msTabs, append: appendMsTab, remove: removeMsTab } = useFieldArray({
            name: "dataInsights.multiSource.tabs",
            control
        });

        return (
            <div className="space-y-6">
                {/* Multi-Source Tabs */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="flex items-center gap-1">
                            Tabs (Multi-Source Reasoning)
                        </Label>
                        <button
                            type="button"
                            onClick={() => appendMsTab({ id: crypto.randomUUID(), title: "", contentHtml: "" })}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                            + Add Tab
                        </button>
                    </div>
                    <div className="space-y-2">
                        {msTabs.map((field, index) => {
                            const base = `dataInsights.multiSource.tabs.${index}`;
                            const titleVal = watch(`${base}.title`);
                            const contentVal = watch(`${base}.contentHtml`);

                            return (
                                <div
                                    key={field.id}
                                    className="flex items-start gap-2 rounded-xl border border-gray-200 p-2 dark:border-gray-700"
                                >
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            type="text"
                                            placeholder={`Tab ${index + 1} Title`}
                                            value={titleVal}
                                            onChange={(e) => setValue(`${base}.title`, e.target.value)}
                                        />
                                        {/* <Input
                                            type="text"
                                            placeholder={`Tab ${index + 1} Content`}
                                            value={contentVal}
                                            onChange={(e) => setValue(`${base}.contentHtml`, e.target.value)}
                                        /> */}
                                        <RichTextEditor initialValue={contentVal} onChange={(e) => setValue(`${base}.contentHtml`, e)} />
                                    </div>
                                    {msTabs.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMsTab(index)}
                                            className="mt-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Multi-Source Statements */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="flex items-center gap-1">
                            Statements (Multi-Source Reasoning)
                        </Label>
                        <button
                            type="button"
                            onClick={() => appendMsStatement({ id: crypto.randomUUID(), text: "", correct: "yes" })}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                            + Add Statement
                        </button>
                    </div>
                    <div className="space-y-2">
                        {msStatements.map((field, index) => {
                            const base = `dataInsights.multiSource.statements.${index}`;
                            const textVal = watch(`${base}.text`);
                            const correctVal = watch(`${base}.correct`) || "yes";
                            const yesLabelVal = watch(`${base}.yesLabel`) || "Yes";
                            const noLabelVal = watch(`${base}.noLabel`) || "No";

                            return (
                                <div
                                    key={field.id}
                                    className="flex items-start gap-2 rounded-xl border border-gray-200 p-2 dark:border-gray-700"
                                >
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            type="text"
                                            placeholder={`Statement ${index + 1}`}
                                            value={textVal}
                                            onChange={(e) => setValue(`${base}.text`, e.target.value)}
                                        />
                                        <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-300">
                                            <label className="inline-flex items-center gap-1">
                                                <input
                                                    type="radio"
                                                    className="h-3 w-3"
                                                    checked={correctVal === "yes"}
                                                    onChange={() => setValue(`${base}.correct`, "yes")}
                                                />
                                                {yesLabelVal} (correct)
                                            </label>
                                            <label className="inline-flex items-center gap-1">
                                                <input
                                                    type="radio"
                                                    className="h-3 w-3"
                                                    checked={correctVal === "no"}
                                                    onChange={() => setValue(`${base}.correct`, "no")}
                                                />
                                                {noLabelVal} (correct)
                                            </label>
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                type="text"
                                                placeholder="Yes Label"
                                                value={yesLabelVal}
                                                onChange={(e) => setValue(`${base}.yesLabel`, e.target.value)}
                                                className="text-xs py-1 px-2"
                                            />
                                            <Input
                                                type="text"
                                                placeholder="No Label"
                                                value={noLabelVal}
                                                onChange={(e) => setValue(`${base}.noLabel`, e.target.value)}
                                                className="text-xs py-1 px-2"
                                            />
                                        </div>
                                    </div>
                                    {msStatements.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMsStatement(index)}
                                            className="mt-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // TWO-PART ANALYSIS
    if (isTwoPart) {
        // Use useFieldArray for options
        const { fields: tpOptions, append: appendTpOption, remove: removeTpOption } = useFieldArray({
            name: "dataInsights.twoPart.options",
            control
        });

        // Use useFieldArray for columns
        const { fields: tpColumns, append: appendTpColumn, remove: removeTpColumn } = useFieldArray({
            name: "dataInsights.twoPart.columns",
            control
        });

        const stemVal = watch("dataInsights.twoPart.stem");

        console.log(watch("dataInsights.twoPart"));

        return (
            <div className="space-y-6">
                {/* Stem */}
                <div>
                    <Label>Stem (Optional)</Label>
                    <Input
                        type="text"
                        placeholder="Enter optional stem text"
                        value={stemVal || ""}
                        onChange={(e) => setValue("dataInsights.twoPart.stem", e.target.value)}
                    />
                </div>

                {/* Two-Part Columns */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="flex items-center gap-1">
                            Columns (Two-Part Analysis)
                        </Label>
                        <button
                            type="button"
                            onClick={() => appendTpColumn({ id: crypto.randomUUID(), title: "" })}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                            + Add Column
                        </button>
                    </div>
                    <div className="space-y-2">
                        {tpColumns.map((field, index) => {
                            const base = `dataInsights.twoPart.columns.${index}`;
                            const titleVal = watch(`${base}.title`);

                            return (
                                <div
                                    key={field.id}
                                    className="flex items-start gap-2 rounded-xl border border-gray-200 p-2 dark:border-gray-700"
                                >
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            type="text"
                                            placeholder={`Column ${index + 1} Title`}
                                            value={titleVal}
                                            onChange={(e) => setValue(`${base}.title`, e.target.value)}
                                        />
                                    </div>
                                    {tpColumns.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTpColumn(index)}
                                            className="mt-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Two-Part Options */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="flex items-center gap-1">
                            Options (Two-Part Analysis)
                        </Label>
                        <button
                            type="button"
                            onClick={() => appendTpOption({ id: crypto.randomUUID(), label: "" })}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                            + Add Option
                        </button>
                    </div>
                    <div className="space-y-2">
                        {tpOptions.map((field, index) => {
                            const base = `dataInsights.twoPart.options.${index}`;
                            const labelVal = watch(`${base}.label`);

                            return (
                                <div
                                    key={field.id}
                                    className="flex items-start gap-2 rounded-xl border border-gray-200 p-2 dark:border-gray-700"
                                >
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            type="text"
                                            placeholder={`Option ${index + 1} Label`}
                                            value={labelVal}
                                            onChange={(e) => setValue(`${base}.label`, e.target.value)}
                                        />
                                    </div>
                                    {tpOptions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTpOption(index)}
                                            className="mt-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Correct Answer Mapping */}
                <div>
                    <Label>Correct Answers by Column</Label>
                    <p className="text-xs text-gray-500 mb-2">
                        Select the correct option for each column.
                    </p>

                    <div className="space-y-2">
                        {(() => {
                            const columnsV = watch("dataInsights.twoPart.columns") || [];

                            return columnsV.map((col, colIndex) => {
                                const colBase = `dataInsights.twoPart.columns.${colIndex}`;
                                const colTitle = watch(`${colBase}.title`);
                                const correctOptionId = watch(
                                    `dataInsights.twoPart.correctByColumn.${col.id}`
                                );
                                const tpOptionsV = watch("dataInsights.twoPart.options") || [];

                                return (
                                    <div key={col.id} className="flex items-center gap-2">
                                        <Label className="flex-1 text-sm">{colTitle}</Label>

                                        <Select
                                            options={tpOptionsV.map((opt, idx) => ({
                                                value: opt.id,
                                                label: opt.label || `Option ${idx + 1}`,
                                            }))}
                                            defaultValue={correctOptionId || ""}
                                            onChange={(value) => {
                                                setValue(
                                                    `dataInsights.twoPart.correctByColumn.${col.id}`,
                                                    value
                                                );
                                            }}
                                            className="flex-1"
                                        />
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

            </div>
        );
    }

    // TABLE ANALYSIS
    if (isTable) {
        // Use useFieldArray for table rows
        const { fields: taRows, append: appendTaRow, remove: removeTaRow } = useFieldArray({
            name: "dataInsights.tableAnalysis.table.rows",
            control
        });

        // Use useFieldArray for table statements
        const { fields: taStatements, append: appendTaStatement, remove: removeTaStatement } = useFieldArray({
            name: "dataInsights.tableAnalysis.statements",
            control
        });

        const columnsVal = watch("dataInsights.tableAnalysis.table.columns") || [];

        const handleAddColumn = () => {
            const newColumns = [...columnsVal, `Column ${columnsVal.length + 1}`];
            setValue("dataInsights.tableAnalysis.table.columns", newColumns);
        };

        const handleRemoveColumn = (index: number) => {
            if (columnsVal.length <= 1) return; // Prevent removing last column
            const newColumns = columnsVal.filter((_: any, i: number) => i !== index);
            setValue("dataInsights.tableAnalysis.table.columns", newColumns);
            // Optionally, also remove the corresponding cell from each row
            taRows.forEach((row, rowIndex) => {
                const rowCells = watch(`dataInsights.tableAnalysis.table.rows.${rowIndex}.cells`) || [];
                if (rowCells.length > index) {
                    rowCells.splice(index, 1);
                    setValue(`dataInsights.tableAnalysis.table.rows.${rowIndex}.cells`, rowCells);
                }
            });
        };

        const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
            const currentCells = watch(`dataInsights.tableAnalysis.table.rows.${rowIndex}.cells`) || [];
            const updatedCells = [...currentCells];
            updatedCells[colIndex] = value;
            setValue(`dataInsights.tableAnalysis.table.rows.${rowIndex}.cells`, updatedCells);
        };

        return (
            <div className="space-y-6">
                {/* Table Columns */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="flex items-center gap-1">
                            Table Columns
                        </Label>
                        <button
                            type="button"
                            onClick={handleAddColumn}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                            + Add Column
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {columnsVal.map((col: string, index: number) => (
                            <div key={index} className="flex items-center gap-1">
                                <Input
                                    type="text"
                                    value={col}
                                    onChange={(e) => {
                                        const newColumns = [...columnsVal];
                                        newColumns[index] = e.target.value;
                                        setValue("dataInsights.tableAnalysis.table.columns", newColumns);
                                    }}
                                    className="text-xs py-1 px-2 min-w-[80px]"
                                />
                                {columnsVal.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveColumn(index)}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table Rows */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="flex items-center gap-1">
                            Table Rows
                        </Label>
                        <button
                            type="button"
                            onClick={() => appendTaRow({ id: crypto.randomUUID(), cells: Array(columnsVal.length).fill("") })}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                            + Add Row
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                                <tr>
                                    {columnsVal.map((col: string, index: number) => (
                                        <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {col}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {taRows.map((field, index) => {
                                    const base = `dataInsights.tableAnalysis.table.rows.${index}`;
                                    const cells = watch(`${base}.cells`) || Array(columnsVal.length).fill("");

                                    return (
                                        <tr key={field.id}>
                                            {cells.map((cell: string, cellIndex: number) => (
                                                <td key={cellIndex} className="px-3 py-2 whitespace-nowrap">
                                                    <Input
                                                        type="text"
                                                        value={cell}
                                                        onChange={(e) => handleCellChange(index, cellIndex, e.target.value)}
                                                        className="text-xs py-1 px-2"
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => removeTaRow(index)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Table Statements */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="flex items-center gap-1">
                            Statements (Table Analysis)
                        </Label>
                        <button
                            type="button"
                            onClick={() => appendTaStatement({ id: crypto.randomUUID(), text: "", correct: "true" })}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                            + Add Statement
                        </button>
                    </div>
                    <div className="space-y-2">
                        {taStatements.map((field, index) => {
                            const base = `dataInsights.tableAnalysis.statements.${index}`;
                            const textVal = watch(`${base}.text`);
                            const correctVal = watch(`${base}.correct`) || "true";
                            const trueLabelVal = watch(`${base}.trueLabel`) || "True";
                            const falseLabelVal = watch(`${base}.falseLabel`) || "False";

                            return (
                                <div
                                    key={field.id}
                                    className="flex items-start gap-2 rounded-xl border border-gray-200 p-2 dark:border-gray-700"
                                >
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            type="text"
                                            placeholder={`Statement ${index + 1}`}
                                            value={textVal}
                                            onChange={(e) => setValue(`${base}.text`, e.target.value)}
                                        />
                                        <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-300">
                                            <label className="inline-flex items-center gap-1">
                                                <input
                                                    type="radio"
                                                    className="h-3 w-3"
                                                    checked={correctVal === "true"}
                                                    onChange={() => setValue(`${base}.correct`, "true")}
                                                />
                                                {trueLabelVal} (correct)
                                            </label>
                                            <label className="inline-flex items-center gap-1">
                                                <input
                                                    type="radio"
                                                    className="h-3 w-3"
                                                    checked={correctVal === "false"}
                                                    onChange={() => setValue(`${base}.correct`, "false")}
                                                />
                                                {falseLabelVal} (correct)
                                            </label>
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                type="text"
                                                placeholder="True Label"
                                                value={trueLabelVal}
                                                onChange={(e) => setValue(`${base}.trueLabel`, e.target.value)}
                                                className="text-xs py-1 px-2"
                                            />
                                            <Input
                                                type="text"
                                                placeholder="False Label"
                                                value={falseLabelVal}
                                                onChange={(e) => setValue(`${base}.falseLabel`, e.target.value)}
                                                className="text-xs py-1 px-2"
                                            />
                                        </div>
                                    </div>
                                    {taStatements.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTaStatement(index)}
                                            className="mt-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // GRAPHICS INTERPRETATION
    if (isGraphics) {
        // Use useFieldArray for dropdowns
        const { fields: giDropdowns, append: appendGiDropdown, remove: removeGiDropdown } = useFieldArray({
            name: "dataInsights.graphics.dropdowns",
            control
        });

        const promptVal = watch("dataInsights.graphics.prompt");

        return (
            <div className="space-y-6">
                {/* Prompt */}
                <div>
                    <Label>Prompt</Label>
                    <Input
                        type="text"
                        placeholder="Enter the prompt for the graphics interpretation question"
                        value={promptVal || ""}
                        onChange={(e) => setValue("dataInsights.graphics.prompt", e.target.value)}
                    />
                </div>

                {/* Graphics Dropdowns */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="flex items-center gap-1">
                            Dropdowns (Graphics Interpretation)
                        </Label>
                        <button
                            type="button"
                            onClick={() => appendGiDropdown({ id: crypto.randomUUID(), label: "", options: [""], correctIndex: 0 })}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                            + Add Dropdown
                        </button>
                    </div>
                    <div className="space-y-4">
                        {giDropdowns.map((field, index) => {
                            const base = `dataInsights.graphics.dropdowns.${index}`;
                            const labelVal = watch(`${base}.label`);
                            const optionsVal = watch(`${base}.options`) || [""];
                            const correctIndexVal = watch(`${base}.correctIndex`) ?? 0;

                            const handleAddOption = (dropdownIndex: number) => {
                                const currentOptions = watch(`dataInsights.graphics.dropdowns.${dropdownIndex}.options`) || [""];
                                setValue(`dataInsights.graphics.dropdowns.${dropdownIndex}.options`, [...currentOptions, ""]);
                            };

                            const handleRemoveOption = (dropdownIndex: number, optionIndex: number) => {
                                if (optionsVal.length <= 1) return; // Prevent removing last option
                                const currentOptions = [...optionsVal];
                                currentOptions.splice(optionIndex, 1);
                                setValue(`dataInsights.graphics.dropdowns.${dropdownIndex}.options`, currentOptions);

                                if (correctIndexVal === optionIndex) {
                                    setValue(`dataInsights.graphics.dropdowns.${dropdownIndex}.correctIndex`, 0);
                                } else if (correctIndexVal > optionIndex) {
                                    setValue(`dataInsights.graphics.dropdowns.${dropdownIndex}.correctIndex`, correctIndexVal - 1);
                                }
                            };

                            const handleOptionChange = (dropdownIndex: number, optionIndex: number, value: string) => {
                                const currentOptions = watch(`dataInsights.graphics.dropdowns.${dropdownIndex}.options`) || [""];
                                const updatedOptions = [...currentOptions];
                                updatedOptions[optionIndex] = value;
                                setValue(`dataInsights.graphics.dropdowns.${dropdownIndex}.options`, updatedOptions);
                            };

                            return (
                                <div key={field.id} className="rounded-xl border border-gray-200 p-2 dark:border-gray-700">
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className="flex-1">
                                            <Input
                                                type="text"
                                                placeholder={`Dropdown ${index + 1} Label`}
                                                value={labelVal}
                                                onChange={(e) => setValue(`${base}.label`, e.target.value)}
                                            />
                                        </div>
                                        {giDropdowns.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeGiDropdown(index)}
                                                className="mt-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="ml-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm">Options</Label>
                                            <button
                                                type="button"
                                                onClick={() => handleAddOption(index)}
                                                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                + Add Option
                                            </button>
                                        </div>
                                        {optionsVal.map((opt: string, optIndex: number) => (
                                            <div key={optIndex} className="flex items-center gap-2">
                                                <Input
                                                    type="text"
                                                    placeholder={`Option ${optIndex + 1}`}
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                                                    className="text-xs py-1 px-2"
                                                />
                                                {optionsVal.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveOption(index, optIndex)}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <p className="text-xs text-gray-500">Choose Correct Option</p>
                                        <Select
                                            options={[
                                                ...optionsVal.map((opt:any, optIndex: number) => ({ value: optIndex.toString(), label: `${opt.trim()} ${optIndex + 1}` })),
                                            ]}
                                            defaultValue={correctIndexVal}
                                            onChange={(value: string) => {
                                                if (value !== undefined) {
                                                    setValue(`${base}.correctIndex`, parseInt(value, 10));
                                                }
                                            }}
                                            className="w-32 text-xs"
                                        />
                                        <div className="text-xs text-gray-500">
                                            Correct Option: {optionsVal[correctIndexVal] || "None selected"}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};