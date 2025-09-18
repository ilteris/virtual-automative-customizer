import React, { useState, useEffect } from 'react';
import { Part } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { TrashIcon } from './icons';

interface PartInputProps {
  part: Part;
  index: number;
  onNoteChange: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
}

const PartInput: React.FC<PartInputProps> = ({ part, index, onNoteChange, onRemove }) => {
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    fileToBase64(part.image).then(setImageSrc);
  }, [part.image]);

  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
      <div className="flex-shrink-0 flex items-center gap-3">
        <span className="font-bold text-lg text-gray-400">{index + 1}.</span>
        <img src={imageSrc} alt="Part" className="w-16 h-16 object-cover rounded-md bg-gray-800" />
      </div>
      <div className="flex-grow w-full">
        <textarea
          value={part.notes}
          onChange={(e) => onNoteChange(part.id, e.target.value)}
          placeholder={`Instructions for this part (e.g., 'Replace the current wheels with these')`}
          className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md focus:ring-1 focus:ring-blue-500"
          rows={2}
        />
      </div>
      <button onClick={() => onRemove(part.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
        <TrashIcon />
      </button>
    </div>
  );
};

export default PartInput;
