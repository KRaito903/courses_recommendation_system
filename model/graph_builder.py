from typing import Dict
from torch_geometric.data import Data, HeteroData
import torch

class KnowledgeGraphBuilder:
    """Build knowledge graph from course data"""
    
    def __init__(self, data: Dict):
        self.data = data
        self.num_students = len(data['students'])
        self.num_courses = len(data['courses'])
        
    def build_heterogeneous_graph(self) -> HeteroData:
        """Build heterogeneous graph with multiple node and edge types"""
        graph = HeteroData()
        
        # Node features
        graph['student'].x = torch.FloatTensor(self.data['student_features'])
        graph['course'].x = torch.FloatTensor(self.data['course_features'])
        
        # Student-Course edges (enrollments)
        student_ids = [e['student_id'] for e in self.data['enrollments']]
        course_ids = [e['course_id'] for e in self.data['enrollments']]
        ratings = [e['rating'] for e in self.data['enrollments']]
        
        graph['student', 'enrolled', 'course'].edge_index = torch.LongTensor([
            student_ids, course_ids
        ])
        graph['student', 'enrolled', 'course'].edge_attr = torch.FloatTensor(ratings).unsqueeze(1)
        
        # Reverse edge
        graph['course', 'enrolled_by', 'student'].edge_index = torch.LongTensor([
            course_ids, student_ids
        ])
        graph['course', 'enrolled_by', 'student'].edge_attr = torch.FloatTensor(ratings).unsqueeze(1)
        
        # Course-Course edges (prerequisites)
        if self.data['prerequisites']:
            course_ids_pre = [p['course_id'] for p in self.data['prerequisites']]
            prereq_ids = [p['prerequisite_id'] for p in self.data['prerequisites']]
            
            graph['course', 'requires', 'course'].edge_index = torch.LongTensor([
                course_ids_pre, prereq_ids
            ])
            
            # Reverse: is_prerequisite_of
            graph['course', 'prerequisite_of', 'course'].edge_index = torch.LongTensor([
                prereq_ids, course_ids_pre
            ])
        
        return graph
    
    def build_homogeneous_graph(self) -> Data:
        """Build homogeneous graph (for GCN, LightGCN)"""
        # Combine student and course nodes
        num_nodes = self.num_students + self.num_courses
        
        # Node features
        x = torch.cat([
            torch.FloatTensor(self.data['student_features']),
            torch.FloatTensor(self.data['course_features'])
        ], dim=0)
        
        # Edge index (student-course interactions)
        student_ids = [e['student_id'] for e in self.data['enrollments']]
        course_ids = [e['course_id'] + self.num_students for e in self.data['enrollments']]
        
        # Bidirectional edges
        edge_index = torch.LongTensor([
            student_ids + course_ids,
            course_ids + student_ids
        ])
        
        graph = Data(x=x, edge_index=edge_index, num_nodes=num_nodes)
        graph.num_students = self.num_students
        graph.num_courses = self.num_courses
        
        return graph