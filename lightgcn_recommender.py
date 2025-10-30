import torch
import torch.nn as nn
from torch_geometric.nn import LGConv

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