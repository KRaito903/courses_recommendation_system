import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import LGConv, GCNConv, SAGEConv

class LightGCNRecommender(nn.Module):
    """LightGCN: Simplified GCN for recommendation"""
    def __init__(self, num_users: int, num_items: int, embedding_dim: int, num_layers: int = 3):
        super().__init__()
        self.num_users = num_users
        self.num_items = num_items
        self.num_layers = num_layers
        
        # Learnable embeddings
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)
        
        self.conv = LGConv()
        
        # Initialize embeddings
        nn.init.normal_(self.user_embedding.weight, std=0.1)
        nn.init.normal_(self.item_embedding.weight, std=0.1)
    
    def forward(self, edge_index):
        # Get initial embeddings
        x = torch.cat([self.user_embedding.weight, self.item_embedding.weight], dim=0)
        
        # Multi-layer propagation
        all_embeddings = [x]
        for _ in range(self.num_layers):
            x = self.conv(x, edge_index)
            all_embeddings.append(x)
        
        # Average all layers
        x = torch.stack(all_embeddings, dim=0).mean(dim=0)
        
        users, items = x[:self.num_users], x[self.num_users:]
        return users, items

class GCNRecommender(nn.Module):
    """Graph Convolutional Network for recommendation"""
    def __init__(self, in_channels: int, hidden_channels: int, num_layers: int = 3):
        super().__init__()
        self.convs = nn.ModuleList()
        self.convs.append(GCNConv(in_channels, hidden_channels))
        for _ in range(num_layers - 1):
            self.convs.append(GCNConv(hidden_channels, hidden_channels))
        
    def forward(self, x, edge_index):
        for i, conv in enumerate(self.convs):
            x = conv(x, edge_index)
            if i < len(self.convs) - 1:
                x = F.relu(x)
                x = F.dropout(x, p=0.5, training=self.training)
        return x

class GraphSAGERecommender(nn.Module):
    """GraphSAGE for recommendation"""
    def __init__(self, in_channels: int, hidden_channels: int, num_layers: int = 3):
        super().__init__()
        self.convs = nn.ModuleList()
        self.convs.append(SAGEConv(in_channels, hidden_channels))
        for _ in range(num_layers - 1):
            self.convs.append(SAGEConv(hidden_channels, hidden_channels))
    
    def forward(self, x, edge_index):
        for i, conv in enumerate(self.convs):
            x = conv(x, edge_index)
            if i < len(self.convs) - 1:
                x = F.relu(x)
                x = F.dropout(x, p=0.5, training=self.training)
        return x

class KGATRecommender(nn.Module):
    """Knowledge Graph Attention Network for recommendation"""
    def __init__(self, num_users: int, num_items: int, embedding_dim: int, num_layers: int = 3):
        super().__init__()
        self.num_users = num_users
        self.num_items = num_items
        self.num_layers = num_layers
        
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)
        
        # Attention layers
        self.attention_layers = nn.ModuleList([
            nn.Linear(embedding_dim * 2, 1) for _ in range(num_layers)
        ])
        
        self.aggregation_layers = nn.ModuleList([
            nn.Linear(embedding_dim * 2, embedding_dim) for _ in range(num_layers)
        ])
        
        nn.init.normal_(self.user_embedding.weight, std=0.1)
        nn.init.normal_(self.item_embedding.weight, std=0.1)
    
    def forward(self, edge_index):
        x = torch.cat([self.user_embedding.weight, self.item_embedding.weight], dim=0)

        for layer_idx in range(self.num_layers):
            # Compute attention scores per edge (vectorized)
            src, dst = edge_index
            src_emb = x[src]  # (E, D)
            dst_emb = x[dst]  # (E, D)

            # Attention mechanism: compute scalar score per edge
            concat_emb = torch.cat([src_emb, dst_emb], dim=1)  # (E, 2D)
            # attention_scores: (E, 1)
            attention_scores = torch.sigmoid(self.attention_layers[layer_idx](concat_emb))

            # Message: weighted neighbor embedding per edge
            # messages shape: (E, D)
            messages = src_emb * attention_scores

            # Aggregate messages per destination node using index_add (vectorized)
            aggregated = torch.zeros_like(x)
            # dst must be long tensor
            if dst.dtype != torch.long:
                dst = dst.long()
            aggregated = aggregated.index_add(0, dst, messages)

            # Optionally normalize by node degree to avoid scale growth
            # Compute degree per node (number of incoming messages)
            # This prevents very high values for high-degree nodes
            deg = torch.zeros(x.size(0), device=x.device)
            ones = torch.ones(dst.size(0), device=x.device)
            deg = deg.index_add(0, dst, ones)
            deg = deg.clamp(min=1.0).unsqueeze(1)
            aggregated = aggregated / deg

            # Update embeddings
            combined = torch.cat([x, aggregated], dim=1)
            x = self.aggregation_layers[layer_idx](combined)
            x = F.relu(x)
        
        users, items = x[:self.num_users], x[self.num_users:]
        return users, items