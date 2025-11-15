export class Enrollment {
    constructor(enrollment_id, student_ref, course_ref, enrollment_date, status) {
        this.enrollment_id = enrollment_id;
        this.student_ref = student_ref;
        this.course_ref = course_ref;
        this.enrollment_date = enrollment_date;
        this.status = status;
    }
}