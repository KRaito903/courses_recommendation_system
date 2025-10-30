import torch
import torch.nn as nn
import torch.nn.functional as F

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
            # Compute attention scores
            src, dst = edge_index
            src_emb = x[src]
            dst_emb = x[dst]
            
            # Attention mechanism
            concat_emb = torch.cat([src_emb, dst_emb], dim=1)
            attention_scores = torch.sigmoid(self.attention_layers[layer_idx](concat_emb))
            
            # Aggregate neighbors
            aggregated = torch.zeros_like(x)
            for i in range(x.size(0)):
                mask = dst == i
                if mask.sum() > 0:
                    neighbor_emb = src_emb[mask]
                    neighbor_att = attention_scores[mask]
                    weighted_sum = (neighbor_emb * neighbor_att).sum(dim=0)
                    aggregated[i] = weighted_sum
            
            # Update embeddings
            combined = torch.cat([x, aggregated], dim=1)
            x = self.aggregation_layers[layer_idx](combined)
            x = F.relu(x)
        
        users, items = x[:self.num_users], x[self.num_users:]
        return users, items