from typing import Dict, Optional
import networkx as nx
import matplotlib.pyplot as plt
import json
import numpy as np
from torch_geometric.data import Data, HeteroData
import torch

class GraphBuilder:
	"""Build knowledge graph from course recommendation data."""
	def __init__(self, data: Dict, unenrolled_rate: float = 0.0):
		"""
		Initialize the GraphBuilder.
		Args:
			data: in-memory data dict with keys 'students','courses','enrollments'
			unenrolled_rate: float between 0.0 and 1.0 indicating the rate of including 'will_enroll' edges
		"""
		self.data = data
		self.num_students = len(data['students'])
		self.num_courses = len(data['courses'])
		self.num_enrollments = len(data['enrollments'])

		self.unenrolled_rate = unenrolled_rate

	def build_visualization_graph(self, include_will_enroll: bool = True,
				 is_save_gexf: bool = True, built_graph_filepath_prefix: str = './data/built-graph') -> nx.Graph:
		"""
		Build the knowledge graph from the data.
        Args:
            include_will_enroll: whether to include 'will_enroll' edges in the graph
            is_save_gexf: whether to save the built graph to GEXF format
            built_graph_filepath_prefix: prefix for saving the built graph file
		Returns:
		    A NetworkX graph object representing the knowledge graph.
				Nodes have attributes:
				- node_type: 'student' or 'course'
				- orig_id: original integer id from data
				- plus other domain attributes (semester, gpa, course_code, credit...)
				Edges (student -- course) have attributes:
				- type: one of enrollment types in data ('liked','disliked','will_enroll')
				- weight: numeric weight for the enrollment
				- is_enrolled: 1 or 0
		"""
		data = self.data
		students = data.get('students', [])
		courses = data.get('courses', [])
		enrollments = data.get('enrollments', [])

		G = nx.Graph()
		# Add student nodes
		for s in students:
			nid = f"s_{s['student_id']}"
			attrs = {
				'node_type': 'student',
				'orig_id': s['student_id'],
				'student_code': s.get('student_code'),
				'semester': s.get('semester'),
				'gpa': s.get('gpa'),
				'student_major_code': s.get('student_major_code')
			}
			G.add_node(nid, **attrs)

		# Add course nodes
		for c in courses:
			nid = f"c_{c['course_id']}"
			attrs = {
				'node_type': 'course',
				'orig_id': c['course_id'],
				'course_code': c.get('course_code'),
				'semester': c.get('semester'),
				'credit': c.get('credit'),
				'course_major_code': c.get('course_major_code')
			}
			G.add_node(nid, **attrs)

		# Add edges for enrollments
		for e in enrollments:
			etype = e.get('type')
			if etype == 'will_enroll' and not include_will_enroll:
				continue
			sid = f"s_{e['student_id']}"
			cid = f"c_{e['course_id']}"
			weight = e.get('weight')
			# Some datas may not include weight precomputed; attempt to infer
			if weight is None:
				weight = e.get('weight', 0.0)
			is_enrolled = 1 if etype != 'will_enroll' else 0
			edge_attrs = {'type': etype, 'weight': weight, 'is_enrolled': is_enrolled}
			# avoid duplicate edges: if multiple enrollments exist, keep list
			if G.has_edge(sid, cid):
				# store multiple interactions in a list
				existing = G[sid][cid].get('interactions', [])
				existing.append(edge_attrs)
				G[sid][cid]['interactions'] = existing
			else:
				G.add_edge(sid, cid, **edge_attrs)

		if is_save_gexf:
			gexf_filepath = f"{built_graph_filepath_prefix}_{len(students)}-students_{len(courses)}-courses.gexf"
			save_graph_gexf(G, gexf_filepath)
			print(f"Graph saved to {gexf_filepath}")
		return G

	def build_heterogeneous_graph(self) -> HeteroData:
		"""
		Build heterogeneous graph with multiple node and edge types using PyTorch Geometric.
		Returns a HeteroData object with:
			- Node types: 'student', 'course'
			- Edge types: ('student', 'enrolled', 'course'), ('course', 'enrolled_by', 'student')
			- Optionally: ('student', 'will_enroll', 'course'), ('course', 'will_be_enrolled_by', 'student')
		Requires: torch-geometric and torch to be installed.
		"""
		graph = HeteroData()
		# Node features (requires preprocessed data with feature arrays)
		if 'student_features' in self.data and 'course_features' in self.data:
			graph['student'].x = torch.FloatTensor(self.data['student_features'])
			graph['course'].x = torch.FloatTensor(self.data['course_features'])
		else:
			raise ValueError("Preprocessed data with 'student_features' and 'course_features' is required")
		
		# Student-Course edges (enrollments)
		student_ids = [e['student_id'] for e in self.data['enrollments'] if e.get('is_enrolled', 1) == 1]
		course_ids = [e['course_id'] for e in self.data['enrollments'] if e.get('is_enrolled', 1) == 1]
		weights = [e.get('weight', 1.0) for e in self.data['enrollments'] if e.get('is_enrolled', 1) == 1]
		
		graph['student', 'enrolled', 'course'].edge_index = torch.LongTensor([student_ids, course_ids])
		graph['student', 'enrolled', 'course'].edge_attr = torch.FloatTensor(weights).unsqueeze(1)
		
		# Reverse edge
		graph['course', 'enrolled_by', 'student'].edge_index = torch.LongTensor([course_ids, student_ids])
		graph['course', 'enrolled_by', 'student'].edge_attr = torch.FloatTensor(weights).unsqueeze(1)

		if self.unenrolled_rate > 0.0:
			# Student-Course edges (unenrollments/will_enroll)
			student_ids_unenrolled = [e['student_id'] for e in self.data['enrollments'] if e.get('is_enrolled', 1) == 0]
			course_ids_unenrolled = [e['course_id'] for e in self.data['enrollments'] if e.get('is_enrolled', 1) == 0]
			weights_unenrolled = [e.get('weight', 0.5) * self.unenrolled_rate for e in self.data['enrollments'] if e.get('is_enrolled', 1) == 0]
			
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
	
	def build_homogeneous_graph(self, use_features: bool = True) -> Data:
		"""
		Build homogeneous graph using PyTorch Geometric (for GCN, LightGCN, etc.).
		Returns a Data object with all students and courses as nodes (students first, then courses).
			Student nodes: indices 0 to num_students-1
			Course nodes: indices num_students to num_students+num_courses-1	
		Requires: torch-geometric and torch to be installed.
		
		Args:
			use_features: If True, requires student_features and course_features.
			              If False, creates dummy features (for LightGCN/KGAT which learn embeddings).
		"""
		# Combine student and course nodes
		num_nodes = self.num_students + self.num_courses
		
		# Node features
		if use_features:
			if 'student_features' not in self.data or 'course_features' not in self.data:
				raise ValueError("Preprocessed data with 'student_features' and 'course_features' is required when use_features=True")
			
			student_features = torch.FloatTensor(self.data['student_features'])
			course_features = torch.FloatTensor(self.data['course_features'])
			
			# Pad student features with zeros to match course features dimension if needed
			if student_features.size(1) < course_features.size(1):
				padding = torch.zeros(student_features.size(0), course_features.size(1) - student_features.size(1))
				student_features_padded = torch.cat([student_features, padding], dim=1)
			else:
				student_features_padded = student_features
			x = torch.cat([student_features_padded, course_features], dim=0)
		else:
			# Create dummy features (single dimension with node index) for models that don't need features
			x = torch.arange(num_nodes, dtype=torch.float32).unsqueeze(1)
		
		# Edge index (student-course interactions)
		student_ids = [e['student_id'] for e in self.data['enrollments'] if e.get('is_enrolled', 1) == 1]
		course_ids = [e['course_id'] + self.num_students for e in self.data['enrollments'] if e.get('is_enrolled', 1) == 1]
		
		if self.unenrolled_rate > 0.0:
			# Include unenrolled edges
			student_ids_unenrolled = [e['student_id'] for e in self.data['enrollments'] if e.get('is_enrolled', 1) == 0]
			course_ids_unenrolled = [e['course_id'] + self.num_students for e in self.data['enrollments'] if e.get('is_enrolled', 1) == 0]

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
		return graph

	@staticmethod
	def get_subgraph_for_students(G: nx.Graph, student_ids, radius: int = 1) -> nx.Graph:
		"""
		Return an induced subgraph around multiple students up to `radius` hops.
		Args:
			G: NetworkX graph
			student_ids: iterable of integer student ids (or node names like 's_0')
			radius: number of hops from each student node to include
		"""
		# normalize to node names
		seed_nodes = set()
		for sid in student_ids:
			if isinstance(sid, str) and sid.startswith('s_'):
				seed_nodes.add(sid)
			else:
				seed_nodes.add(f"s_{int(sid)}")

		nodes = set(seed_nodes)
		frontier = set(seed_nodes)
		for _ in range(radius):
			neighbors = set()
			for n in frontier:
				neighbors |= set(G.neighbors(n))
			frontier = neighbors - nodes
			nodes |= frontier
		return G.subgraph(nodes).copy()

	@staticmethod
	def visualize(G: nx.Graph, figsize=(10, 8), show_labels: bool = False, node_size: int = 200,
			is_save_img: bool = True, visualized_graph_filepath_prefix: str = './data/visualized-graph',
			seed_students: Optional[list] = None, hops: Optional[int] = None):
		"""
		Visualize the full graph or a NetworkX graph.
		Args:
			G: NetworkX graph to visualize.
			figsize: size of the matplotlib figure
            show_labels: whether to show node labels
			node_size: size of the nodes in the visualization
			is_save_img: whether to save the visualization as an image file
            visualized_graph_filepath_prefix: prefix for saving the visualized graph image file
		"""
		# Compute layout
		pos = nx.spring_layout(G, seed=42)

		# Node colors based on type
		node_colors = []
		node_sizes = []
		labels = {}
		for n, d in G.nodes(data=True):
			if d.get('node_type') == 'student':
				node_colors.append('#1f78b4')
				node_sizes.append(node_size)
				labels[n] = f"S{d.get('orig_id')}" if show_labels else ''
			else:
				node_colors.append('#33a02c')
				node_sizes.append(int(node_size * 1.2))
				labels[n] = f"C{d.get('orig_id')}" if show_labels else ''

		# Edge colors by enrollment type
		color_map = {
			'liked': '#2ca02c',      # green
			'disliked': '#d62728',   # red
			'will_enroll': '#ff7f0e',# orange
			'unknown': '#7f7f7f'     # gray
		}

		def _edge_type(u, v):
			ed = G.get_edge_data(u, v, {})
			# direct type
			if 'type' in ed and ed['type'] is not None:
				return str(ed['type'])
			# interactions list: pick most common type
			if 'interactions' in ed:
				ints = ed['interactions']
				if isinstance(ints, str):
					# sometimes interactions may be serialized; try to parse
					try:
						parsed = json.loads(ints)
						if isinstance(parsed, list) and parsed:
							first = parsed[0]
							if isinstance(first, dict) and 'type' in first:
								return str(first['type'])
					except Exception:
						pass
				if isinstance(ints, list) and ints:
					# count types
					types = [it.get('type') for it in ints if isinstance(it, dict) and 'type' in it]
					if types:
						# return most common
						return max(set(types), key=types.count)
			# fallback
			return 'unknown'

		edge_colors = []
		edge_list = []
		for u, v in G.edges():
			type_ = _edge_type(u, v)
			edge_colors.append(color_map.get(type_, color_map['unknown']))
			edge_list.append((u, v))

		# create figure and set window title to include seed students and hops when provided
		fig = plt.figure(figsize=figsize)
		# Build title string
		title_parts = []
		if seed_students:
			try:
				normalized = []
				for s in seed_students:
					if isinstance(s, str) and s.startswith('s_'):
						normalized.append(str(int(s.replace('s_', ''))))
					else:
						normalized.append(str(int(s)))
				title_parts.append('students=' + ','.join(normalized))
			except Exception:
				# fallback to string representation
				title_parts.append('students=' + str(seed_students))
		if hops is not None:
			title_parts.append(f'hops={int(hops)}')
		if title_parts:
			title = ' | '.join(title_parts)
			# attempt to set window title in a backend-safe way
			try:
				mgr = fig.canvas.manager
				mgr.set_window_title(title)
			except Exception:
				try:
					fig.canvas.set_window_title(title)
				except Exception:
					# some backends (e.g., non-GUI) do not support window titles; ignore
					pass
		nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=node_sizes)
		# draw colored edges
		nx.draw_networkx_edges(G, pos, edgelist=edge_list, edge_color=edge_colors, alpha=0.8)
		if show_labels:
			nx.draw_networkx_labels(G, pos, labels, font_size=8)

		# Legend for edge types
		from matplotlib.patches import Patch
		legend_handles = [Patch(color=color_map[k], label=k) for k in ['liked','disliked','will_enroll']]
		plt.legend(handles=legend_handles, title='Enrollment type', loc='lower left')

		# Node counts annotation (top-left)
		student_count = sum(1 for _, d in G.nodes(data=True) if d.get('node_type') == 'student')
		course_count = sum(1 for _, d in G.nodes(data=True) if d.get('node_type') == 'course')
		info_text = f"Nodes: students={student_count}, courses={course_count}"
		plt.annotate(info_text, xy=(0.01, 0.99), xycoords='figure fraction', fontsize=9, verticalalignment='top')

		# Small annotation note (bottom-left)
		plt.annotate('Edge color: liked=green, disliked=red, will_enroll=orange', xy=(0.01, 0.02), xycoords='figure fraction', fontsize=8)

		plt.axis('off')
		if is_save_img:
			img_filepath = f"{visualized_graph_filepath_prefix}_{student_count}-students_{course_count}-courses.png"
			plt.savefig(img_filepath, dpi=300)
			print(f"Graph visualization saved to {img_filepath}")
		plt.show()

def save_graph_gexf(data: nx.Graph, filepath: str = './data/graph.gexf'):
	"""Save built graph to GEXF format for use in graph tools (Gephi)."""
	# Convert node/edge attributes to plain Python types (and serialize lists/dicts to JSON strings) before writing.
	def _sanitize(v):
		# convert numpy scalar to python scalar
		if isinstance(v, (np.generic,)):
			try:
				return v.item()
			except Exception:
				return str(v)
		# numpy arrays -> JSON string
		if isinstance(v, np.ndarray):
			return json.dumps(v.tolist(), ensure_ascii=False)
		# dict -> JSON string
		if isinstance(v, dict):
			# sanitize dict values
			return json.dumps({k: _sanitize(val) for k, val in v.items()}, ensure_ascii=False)
		# list/tuple -> JSON string
		if isinstance(v, (list, tuple)):
			return json.dumps([_sanitize(x) for x in v], ensure_ascii=False)
		# None -> empty string
		if v is None:
			return ""
		# basic python types
		if isinstance(v, (str, int, float, bool)):
			return v
		# fallback to string
		return str(v)

	H = nx.Graph()
	for n, d in data.nodes(data=True):
		attrs = {k: _sanitize(v) for k, v in d.items()}
		H.add_node(n, **attrs)

	for u, v, ed in data.edges(data=True):
		ed_attrs = {k: _sanitize(val) for k, val in ed.items()}
		H.add_edge(u, v, **ed_attrs)

	nx.write_gexf(H, filepath)