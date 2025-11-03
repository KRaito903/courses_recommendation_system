from typing import Dict
from torch_geometric.data import Data, HeteroData
import torch

class KnowledgeGraphBuilder:
    """Build knowledge graph from course data"""
    
    def __init__(self, data: Dict, unenrolled_rate: float = 0.0):
        self.data = data
        self.num_students = len(data['students'])
        self.num_courses = len(data['courses'])
        self.unenrolled_rate = unenrolled_rate
        
        # Create course ID to index mapping
        self.course_id_to_idx = {course['course_id']: idx for idx, course in enumerate(data['courses'])}
        self.course_idx_to_id = {idx: course['course_id'] for idx, course in enumerate(data['courses'])}
        
    def build_heterogeneous_graph(self) -> HeteroData:
        """Build heterogeneous graph with multiple node and edge types"""
        graph = HeteroData()
        
        # Node features
        graph['student'].x = torch.FloatTensor(self.data['student_features'])
        graph['course'].x = torch.FloatTensor(self.data['course_features'])
        
        # Student-Course edges (enrollments)
        student_ids = [e['student_id'] for e in self.data['enrollments'] if e['is_enrolled'] == 1]
        course_ids = [self.course_id_to_idx[e['course_id']] for e in self.data['enrollments'] if e['is_enrolled'] == 1]
        weights = [e['weight'] for e in self.data['enrollments'] if e['is_enrolled'] == 1]
        
        graph['student', 'enrolled', 'course'].edge_index = torch.LongTensor([student_ids, course_ids])
        graph['student', 'enrolled', 'course'].edge_attr = torch.FloatTensor(weights).unsqueeze(1)
        
        # Reverse edge
        graph['course', 'enrolled_by', 'student'].edge_index = torch.LongTensor([course_ids, student_ids])
        graph['course', 'enrolled_by', 'student'].edge_attr = torch.FloatTensor(weights).unsqueeze(1)

        if self.unenrolled_rate > 0.0:
            # Student-Course edges (unenrollments)
            student_ids_unenrolled = [e['student_id'] for e in self.data['enrollments'] if e['is_enrolled'] == 0]
            course_ids_unenrolled = [self.course_id_to_idx[e['course_id']] for e in self.data['enrollments'] if e['is_enrolled'] == 0]
            weights_unenrolled = [e['weight'] * self.unenrolled_rate for e in self.data['enrollments'] if e['is_enrolled'] == 0]
            
            chosen_indices = torch.randperm(len(student_ids_unenrolled))[:int(len(student_ids_unenrolled) * self.unenrolled_rate)]
            chosen_student_ids_unenrolled = [student_ids_unenrolled[i] for i in chosen_indices]
            chosen_course_ids_unenrolled = [course_ids_unenrolled[i] for i in chosen_indices]
            chosen_weights_unenrolled = [weights_unenrolled[i] for i in chosen_indices]
            graph['student', 'will_enroll', 'course'].edge_index = torch.LongTensor([chosen_student_ids_unenrolled, chosen_course_ids_unenrolled])
            graph['student', 'will_enroll', 'course'].edge_attr = torch.FloatTensor(chosen_weights_unenrolled).unsqueeze(1)
            
            # Reverse edge
            graph['course', 'will_be_enrolled_by', 'student'].edge_index = torch.LongTensor([chosen_course_ids_unenrolled, chosen_student_ids_unenrolled])
            graph['course', 'will_be_enrolled_by', 'student'].edge_attr = torch.FloatTensor(chosen_weights_unenrolled).unsqueeze(1)
        return graph
    
    def build_homogeneous_graph(self) -> Data:
        """Build homogeneous graph (for GCN, LightGCN)"""
        # Combine student and course nodes
        num_nodes = self.num_students + self.num_courses
        
        # Node features
        student_features = torch.FloatTensor(self.data['student_features'])
        course_features = torch.FloatTensor(self.data['course_features'])
        
        # Pad student features with zeros to match course features dimension
        padding = torch.zeros(student_features.size(0), course_features.size(1) - student_features.size(1))
        student_features_padded = torch.cat([student_features, padding], dim=1)
        
        x = torch.cat([student_features_padded, course_features], dim=0)
        
        # Edge index (student-course interactions)
        student_ids = [e['student_id'] for e in self.data['enrollments'] if e['is_enrolled'] == 1]
        course_ids = [self.course_id_to_idx[e['course_id']] + self.num_students for e in self.data['enrollments'] if e['is_enrolled'] == 1]
        
        if self.unenrolled_rate > 0.0:
            # Include unenrolled edges
            student_ids_unenrolled = [e['student_id'] for e in self.data['enrollments'] if e['is_enrolled'] == 0]
            course_ids_unenrolled = [self.course_id_to_idx[e['course_id']] + self.num_students for e in self.data['enrollments'] if e['is_enrolled'] == 0]

            chosen_indices = torch.randperm(len(student_ids_unenrolled))[:int(len(student_ids_unenrolled) * self.unenrolled_rate)]
            chosen_student_ids_unenrolled = [student_ids_unenrolled[i] for i in chosen_indices]
            chosen_course_ids_unenrolled = [course_ids_unenrolled[i] for i in chosen_indices]

            student_ids += chosen_student_ids_unenrolled
            course_ids += chosen_course_ids_unenrolled

        # Bidirectional edges
        edge_index = torch.LongTensor([
            student_ids + course_ids,
            course_ids + student_ids
        ])
        
        graph = Data(x=x, edge_index=edge_index, num_nodes=num_nodes)
        graph.num_students = self.num_students
        graph.num_courses = self.num_courses
        # Store the course ID mappings in the graph for later use
        graph.course_id_to_idx = self.course_id_to_idx
        graph.course_idx_to_id = self.course_idx_to_id
        
        return graph