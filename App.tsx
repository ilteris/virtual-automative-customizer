import React, { useState, useCallback, useEffect } from 'react';
import { Part } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { callGeminiApi } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import { PlusIcon, TrashIcon, CarIcon, SparklesIcon, ResetIcon } from './components/icons';
import PartInput from './components/PartInput';

const App: React.FC = () => {
  const [carImage, setCarImage] = useState<File | null>(null);
  const [carImageSrc, setCarImageSrc] = useState<string | null>(null);
  const [currentDisplayImageSrc, setCurrentDisplayImageSrc] = useState<string | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (carImage) {
      fileToBase64(carImage).then(src => {
        setCarImageSrc(src);
        setCurrentDisplayImageSrc(src);
      });
    } else {
      setCarImageSrc(null);
      setCurrentDisplayImageSrc(null);
    }
  }, [carImage]);

  const handleCarUpload = (files: File[]) => {
    if (files.length > 0) {
      handleReset();
      setCarImage(files[0]);
    }
  };

  const handleAddPart = (files: File[]) => {
    const newParts: Part[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      image: file,
      notes: '',
    }));
    setParts(prev => [...prev, ...newParts]);
  };
  
  const handlePartNoteChange = (id: string, notes: string) => {
    setParts(prev => prev.map(part => part.id === id ? { ...part, notes } : part));
  };
  
  const handleRemovePart = (id: string) => {
    setParts(prev => prev.filter(part => part.id !== id));
  };

  const handleReset = () => {
    setCarImage(null);
    setCarImageSrc(null);
    setCurrentDisplayImageSrc(null);
    setParts([]);
    setGeneralNotes('');
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
  };
  
  const handleGenerate = async () => {
    if (!carImageSrc) {
      setError("Please upload a base car image first.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setCurrentDisplayImageSrc(carImageSrc); // Start from original image
    
    let currentImageSrc = carImageSrc;
    const baseImageType = carImage?.type || 'image/jpeg';

    try {
      // Sequentially apply each part
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part.notes.trim()) {
           throw new Error(`Please provide instructions for part #${i + 1}.`);
        }
        setLoadingMessage(`Applying part ${i + 1} of ${parts.length}...`);
        
        const partImageSrc = await fileToBase64(part.image);
        
        const newImageBase64 = await callGeminiApi(
          { data: currentImageSrc.split(',')[1], mimeType: baseImageType },
          { data: partImageSrc.split(',')[1], mimeType: part.image.type },
          part.notes
        );
        
        currentImageSrc = `data:image/png;base64,${newImageBase64}`;
        setCurrentDisplayImageSrc(currentImageSrc);
      }
      
      // Apply general notes if any
      if (generalNotes.trim()) {
        setLoadingMessage("Applying general modifications...");
        const newImageBase64 = await callGeminiApi(
          { data: currentImageSrc.split(',')[1], mimeType: 'image/png' },
          undefined,
          generalNotes
        );
        currentImageSrc = `data:image/png;base64,${newImageBase64}`;
        setCurrentDisplayImageSrc(currentImageSrc);
      }
      
      setLoadingMessage("Done!");

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      setCurrentDisplayImageSrc(carImageSrc); // Revert to original on error
    } finally {
      setIsLoading(false);
    }
  };

  const canGenerate = carImageSrc && (parts.length > 0 || generalNotes.trim());

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
          <Spinner />
          <p className="mt-4 text-lg font-semibold animate-pulse">{loadingMessage}</p>
        </div>
      )}

      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Virtual Automotive Customizer
        </h1>
        <p className="mt-2 text-gray-400 max-w-2xl mx-auto">
          Use AI to visualize modifications on your car. Upload your car, add parts with instructions, and see the result.
        </p>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Controls */}
        <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-400">1.</span> Upload Your Car
            </h2>
            <ImageUploader onFileUpload={handleCarUpload} title="Drag & drop your car photo, or click to select" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-400">2.</span> Add Parts & Instructions
            </h2>
            <div className="space-y-4">
              {parts.map((part, index) => (
                <PartInput key={part.id} part={part} index={index} onNoteChange={handlePartNoteChange} onRemove={handleRemovePart} />
              ))}
            </div>
            <ImageUploader onFileUpload={handleAddPart} multiple={true} title="Add modification parts (wheels, spoilers, etc.)" className="mt-4" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-400">3.</span> General Notes (Optional)
            </h2>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="e.g., Change car color to matte black, make it night time..."
              className="w-full h-24 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={isLoading}
            />
          </div>
          
          {error && <div className="bg-red-900/50 text-red-300 border border-red-700 p-3 rounded-lg text-center">{error}</div>}

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !canGenerate}
              className="w-full flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              <SparklesIcon />
              Apply Modifications
            </button>
             <button
              onClick={handleReset}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-500 transform transition-colors duration-300 disabled:opacity-50"
            >
              <ResetIcon />
              Reset
            </button>
          </div>
        </div>
        
        {/* Right Column: Image Display */}
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex items-center justify-center min-h-[400px] lg:min-h-0">
          {currentDisplayImageSrc ? (
            <img src={currentDisplayImageSrc} alt="Customized Car" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"/>
          ) : (
            <div className="text-center text-gray-500">
              <CarIcon className="w-24 h-24 mx-auto mb-4"/>
              <h3 className="text-xl font-medium">Your customized car will appear here</h3>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};


export default App;