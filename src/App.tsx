import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LibraryPage from './pages/LibraryPage';
import ReaderPage from './pages/ReaderPage';

const App = () => {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<LibraryPage />} />
                <Route path="/reader" element={<ReaderPage />} />
            </Routes>
        </HashRouter>
    );
};

export default App;
