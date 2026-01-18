'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { Plus, UtensilsCrossed } from 'lucide-react';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export default function RestaurantMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    isAvailable: true,
  });

  useEffect(() => {
    fetchUserAndMenuItems();
  }, []);

  const fetchUserAndMenuItems = async () => {
    try {
      // First, get the logged-in user's restaurant ID
      const userResponse = await fetch('/api/auth/verify', { credentials: 'include' });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.user && userData.user.restaurantId) {
          setRestaurantId(userData.user.restaurantId);
          // Fetch menu items for this restaurant
          fetchMenuItems(userData.user.restaurantId);
        } else {
          toast.error('No restaurant associated with this account');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
      setLoading(false);
    }
  };

  const fetchMenuItems = async (restId?: string) => {
    const restaurantIdToUse = restId || restaurantId;
    if (!restaurantIdToUse) return;

    try {
      const response = await fetch(`/api/menu-items?restaurantId=${restaurantIdToUse}`, { 
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category: item.category,
        imageUrl: item.imageUrl || '',
        isAvailable: item.isAvailable,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        imageUrl: '',
        isAvailable: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantId) {
      toast.error('Restaurant ID not found. Please try logging in again.');
      return;
    }
    
    try {
      const url = editingItem 
        ? `/api/menu-items/${editingItem._id}`
        : '/api/menu-items';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          restaurantId: restaurantId, // Add restaurantId to the request
          price: parseFloat(formData.price),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to save menu item');
      }

      toast.success(editingItem ? 'Menu item updated!' : 'Menu item created!');
      handleCloseModal();
      fetchMenuItems();
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      toast.error(error.message || 'Failed to save menu item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await fetch(`/api/menu-items/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }

      toast.success('Menu item deleted!');
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Menu Management</h1>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Menu Item
        </Button>
      </div>

      {menuItems.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="w-12 h-12" />}
          title="No menu items yet"
          description="Start by adding your first menu item"
          action={<Button onClick={() => handleOpenModal()}>Add Menu Item</Button>}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Image</TableHeader>
                <TableHeader>Name</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Price</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{item.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">₹{item.price}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isAvailable ? 'success' : 'danger'}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenModal(item)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(item._id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Margherita Pizza"
          />
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="Describe your dish..."
          />
          
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Price (₹)"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            
            <InputField
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              placeholder="e.g., Pizza, Appetizers"
            />
          </div>
          
          <InputField
            label="Image URL (Optional)"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
          
          <Checkbox
            label="Available for orders"
            checked={formData.isAvailable}
            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
          />
          
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              {editingItem ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
