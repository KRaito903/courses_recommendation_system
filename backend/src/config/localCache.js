
export const cache ={
    coursesMapp: {},  
}

export const setCourseMap = (courseMap) => {
    cache.coursesMapp = courseMap;
}

export const getCourseMap = () => {
    return cache.coursesMapp;
}