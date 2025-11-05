import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Download, ArrowLeft } from 'lucide-react';
import { Button, Card, Alert, Spinner } from '../../components/ui';
import { ROUTES } from '../../utils/constants';
import { useUIStore } from '../../stores';
import { useAuthStore } from '../../stores';
import { createQuestion } from '../../services/questionService';

function BulkImport() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const user = useAuthStore((state) => state.user);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsText(selectedFile);
    }
  };

  // Parse CSV text into rows
  const parseCSV = (text) => {
    const rows = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Expected headers
    const expectedHeaders = [
      'book_id', 'topic_id', 'question_type', 'question_text',
      'option1', 'option2', 'option3', 'option4',
      'correct_options', 'points', 'difficulty', 'explanation'
    ];
    
    // Check if headers match (case-insensitive)
    const normalizedHeaders = headers.map(h => h.toLowerCase());
    const missingHeaders = expectedHeaders.filter(h => !normalizedHeaders.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Get column indices
    const getIndex = (name) => {
      const idx = normalizedHeaders.indexOf(name.toLowerCase());
      return idx >= 0 ? idx : -1;
    };

    const indices = {
      book_id: getIndex('book_id'),
      topic_id: getIndex('topic_id'),
      question_type: getIndex('question_type'),
      question_text: getIndex('question_text'),
      option1: getIndex('option1'),
      option2: getIndex('option2'),
      option3: getIndex('option3'),
      option4: getIndex('option4'),
      correct_options: getIndex('correct_options'),
      points: getIndex('points'),
      difficulty: getIndex('difficulty'),
      explanation: getIndex('explanation'),
    };

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple CSV parsing - handle quoted fields
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add last value

      // Extract values using indices
      const getValue = (idx) => {
        return idx >= 0 && idx < values.length ? values[idx].replace(/^"|"$/g, '') : '';
      };

      const row = {
        book_id: getValue(indices.book_id),
        topic_id: getValue(indices.topic_id),
        question_type: getValue(indices.question_type),
        question_text: getValue(indices.question_text),
        option1: getValue(indices.option1),
        option2: getValue(indices.option2),
        option3: getValue(indices.option3),
        option4: getValue(indices.option4),
        correct_options: getValue(indices.correct_options),
        points: getValue(indices.points),
        difficulty: getValue(indices.difficulty),
        explanation: getValue(indices.explanation),
      };

      rows.push(row);
    }

    return rows;
  };

  // Convert CSV row to question format
  const convertRowToQuestion = (row) => {
    // Build options array
    const options = [];
    const optionTexts = [row.option1, row.option2, row.option3, row.option4];
    
    // Parse correct_options (can be "1", "1,3", etc.)
    const correctIndices = new Set();
    if (row.correct_options) {
      const parts = row.correct_options.replace(/"/g, '').split(',').map(s => s.trim());
      parts.forEach(part => {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= 4) {
          correctIndices.add(num - 1); // Convert to 0-based index
        }
      });
    }

    // Add non-empty options
    optionTexts.forEach((text, index) => {
      if (text && text.trim() !== '') {
        options.push({
          text: text.trim(),
          isCorrect: correctIndices.has(index),
        });
      }
    });

    // Validate
    if (options.length === 0) {
      throw new Error('At least one option is required');
    }

    if (options.filter(opt => opt.isCorrect).length === 0) {
      throw new Error('At least one option must be marked as correct');
    }

    // Validate question type
    const questionType = row.question_type?.toLowerCase();
    if (questionType !== 'multiple_choice' && questionType !== 'true_false') {
      throw new Error(`Invalid question_type: ${row.question_type}. Must be 'multiple_choice' or 'true_false'`);
    }

    // Validate difficulty
    const difficulty = row.difficulty?.toLowerCase();
    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new Error(`Invalid difficulty: ${row.difficulty}. Must be 'easy', 'medium', or 'hard'`);
    }

    // Validate points
    const points = parseInt(row.points, 10);
    if (isNaN(points) || points < 1) {
      throw new Error(`Invalid points: ${row.points}. Must be a number >= 1`);
    }

    return {
      book_id: row.book_id.trim(),
      topic_id: row.topic_id.trim(),
      question_text: row.question_text.trim(),
      question_type: questionType,
      options: options,
      points: points,
      difficulty: difficulty || 'medium',
      explanation: row.explanation?.trim() || '',
    };
  };

  const handleImport = async () => {
    if (!file) {
      showError('Please select a file to import');
      return;
    }

    if (!user) {
      showError('You must be logged in to import questions');
      return;
    }

    try {
      setLoading(true);
      setImportStatus(null);

      // Read file content
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      // Parse CSV
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        throw new Error('No data rows found in CSV file');
      }

      // Import questions
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because row 1 is header, and we're 0-indexed

        try {
          // Convert row to question format
          const questionData = convertRowToQuestion(row);
          
          // Create question
          await createQuestion(questionData, user.$id);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Row ${rowNumber}: ${error.message || 'Unknown error'}`);
          console.error(`Error importing row ${rowNumber}:`, error);
        }
      }

      // Show results
      if (errorCount === 0) {
        setImportStatus({ 
          type: 'success', 
          message: `Successfully imported ${successCount} question(s)!` 
        });
        showSuccess(`Successfully imported ${successCount} question(s)!`);
        // Reset file
        setFile(null);
        setPreview(null);
        // Reset file input
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
          fileInput.value = '';
        }
      } else if (successCount > 0) {
        setImportStatus({ 
          type: 'error', 
          message: `Imported ${successCount} question(s), but ${errorCount} failed. See console for details.` 
        });
        showError(`Imported ${successCount} question(s), but ${errorCount} failed. Check console for details.`);
        console.error('Import errors:', errors);
      } else {
        setImportStatus({ 
          type: 'error', 
          message: `Failed to import all ${errorCount} question(s). See console for details.` 
        });
        showError(`Failed to import all questions. Check console for details.`);
        console.error('Import errors:', errors);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus({ 
        type: 'error', 
        message: error.message || 'Failed to import questions' 
      });
      showError(error.message || 'Failed to import questions');
    } finally {
      setLoading(false);
    }
  };

  const csvTemplate = `book_id,topic_id,question_type,question_text,option1,option2,option3,option4,correct_options,points,difficulty,explanation
book_id_here,topic_id_here,multiple_choice,What is 2+2?,4,5,6,7,"1",1,easy,Basic addition
book_id_here,topic_id_here,true_false,The sky is blue.,True,False,"1",,1,medium,Observed fact`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={ROUTES.ADMIN.DASHBOARD}>
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Import Questions</h1>
          <p className="text-gray-600 mt-1">Import multiple questions from a CSV file</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">CSV Format</h2>
            <p className="text-gray-600 text-sm mb-4">
              Your CSV file should include the following columns:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <code className="text-sm text-gray-700">
                book_id, topic_id, question_type, question_text, option1, option2, option3, option4, correct_options, points, difficulty, explanation
              </code>
            </div>
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvTemplate)}`}
              download="questions_template.csv"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Download className="w-4 h-4" />
              Download CSV Template
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">CSV files only</p>
              </label>
            </div>
          </div>

          {preview && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">{preview.substring(0, 500)}...</pre>
              </div>
            </div>
          )}

          {importStatus && (
            <Alert
              variant={importStatus.type === 'success' ? 'success' : 'danger'}
              title={importStatus.type === 'success' ? 'Success' : 'Error'}
            >
              {importStatus.message}
            </Alert>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={handleImport}
              loading={loading}
              disabled={!file}
              leftIcon={<Upload className="w-5 h-5" />}
            >
              Import Questions
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default BulkImport;

