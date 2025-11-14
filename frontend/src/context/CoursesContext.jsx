import React, { createContext, useContext, useState, useEffect } from 'react';

import * as courseService from '../services/courseService.js';
import { useAuth } from './AuthContext.jsx';

const CoursesContext = createContext();

export const CoursesProvider = ({ children }) => {
    const { currentUser, student } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('Using allCourses from context:', courses);
        const fetchCourses = async () => {
            if (!currentUser || !student) {
                setCourses([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const token = await currentUser.getIdToken();
                const data = await courseService.getStudentCourses(token, student.student.id);
                setCourses(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [currentUser, student]);

    return (
        <CoursesContext.Provider value={{ courses, loading, error, setCourses}}>
            {children}
        </CoursesContext.Provider>
    );  
};

export const useCourses = () => {
    return useContext(CoursesContext);
};