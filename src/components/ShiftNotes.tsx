import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { ShiftNote } from '../types';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export const ShiftNotes: React.FC = () => {
  const [notes, setNotes] = useState<ShiftNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const serviceRole = useAuthStore((state) => state.serviceRole);

  const fetchNotes = async () => {
    try {
      let query = supabase
        .from('shift_notes')
        .select('*')
        .order('date', { ascending: false });

      // Фильтруем заметки по службе
      if (serviceRole !== 'statistics') {
        query = query.eq('service_type', serviceRole);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Ошибка при загрузке заметок');
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [serviceRole]);

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase
        .from('shift_notes')
        .insert({
          content: newNote.trim(),
          date: new Date().toISOString(),
          service_type: serviceRole
        });

      if (error) throw error;

      toast.success('Заметка сохранена');
      setNewNote('');
      await fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Ошибка при сохранении заметки');
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту заметку?')) return;

    try {
      const { error } = await supabase
        .from('shift_notes')
        .delete()
        .match({ id: noteId });

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteId));
      toast.success('Заметка удалена');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Ошибка при удалении заметки');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <textarea
          className="w-full p-2 border rounded"
          rows={4}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Введите заметку..."
        />
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
          onClick={addNote}
        >
          Добавить заметку
        </button>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-auto">
        {notes.map((note) => (
          <div key={note.id} className="border-b pb-2 flex justify-between group">
            <div className="flex-1">
              <div className="text-sm text-gray-600">
                {new Date(note.date).toLocaleString()}
              </div>
              <div className="mt-1 whitespace-pre-wrap">{note.content}</div>
            </div>
            <button
              onClick={() => deleteNote(note.id)}
              className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Удалить заметку"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}