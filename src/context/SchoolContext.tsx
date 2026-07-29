import React, { createContext, useContext, useState } from 'react';

interface SchoolContextType {
  selectedSchool: string; // 'ALL' | 'POSTECH' | 'KAIST' | 'GIST' | 'DGIST' | 'UNIST' | 'KENTECH'
  setSelectedSchool: (school: string) => void;
}

const SchoolContext = createContext<SchoolContextType>({
  selectedSchool: 'ALL',
  setSelectedSchool: () => {},
});

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSchool, setSelectedSchool] = useState<string>(() => {
    return localStorage.getItem('stadium_selected_school') || 'ALL';
  });

  const handleSelectSchool = (school: string) => {
    setSelectedSchool(school);
    localStorage.setItem('stadium_selected_school', school);
  };

  return (
    <SchoolContext.Provider value={{ selectedSchool, setSelectedSchool: handleSelectSchool }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => useContext(SchoolContext);
