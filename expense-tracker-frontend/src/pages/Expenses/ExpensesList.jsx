import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import {
  Edit2,
  Trash2,
  CreditCard,
  Tag,
  Calendar,
  Plus,
  Check,
  X,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  FileText,
  DollarSign,
  TrendingUp,
  PieChart,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  RefreshCw,
  IndianRupee,
  XCircle,
} from "lucide-react";

export default function ExpenseList() {
  // State management
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [showStats, setShowStats] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    description: "",
    payment_method: "cash",
    expense_date: "",
    tags: "",
    receipt: null,
  });

  // Edit state
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    category: "",
    payment_method: "",
    date_from: "",
    date_to: "",
    min_amount: "",
    max_amount: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const [appliedFilters, setAppliedFilters] = useState({
    category: "",
    payment_method: "",
    date_from: "",
    date_to: "",
    min_amount: "",
    max_amount: "",
  });
  const [appliedSearch, setAppliedSearch] = useState("");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  });

  // Loading and error states
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterError, setFilterError] = useState("");

  // Filter validation states
  const [filterValidation, setFilterValidation] = useState({
    category: { valid: true, message: "" },
    payment_method: { valid: true, message: "" },
    date_range: { valid: true, message: "" },
    amount_range: { valid: true, message: "" },
  });

  useEffect(() => {
    load();
    loadCategories();
  }, []);

  // Apply filters whenever filters or search change
  useEffect(() => {
    applyClientSideFilters();
  }, [appliedFilters, appliedSearch, originalItems]);

  // Helper function to get category name and color by ID
  const getCategoryInfo = (categoryId) => {
    if (!categoryId) return { name: 'Uncategorized', color: '#6b7280' };
    const category = categories.find(c => c.id === parseInt(categoryId));
    return category ? { 
      name: category.name, 
      color: category.color_code || '#3498db' 
    } : { name: 'Unknown Category', color: '#6b7280' };
  };

  // Client-side filtering function
  const applyClientSideFilters = useCallback(() => {
    if (!originalItems.length) {
      setItems([]);
      return;
    }

    let filtered = [...originalItems];

    // Apply search filter
    if (appliedSearch && appliedSearch.trim()) {
      const searchLower = appliedSearch.toLowerCase();
      filtered = filtered.filter(item => 
        (item.description || '').toLowerCase().includes(searchLower) ||
        (item.category_name || getCategoryInfo(item.category_id).name || '').toLowerCase().includes(searchLower) ||
        (item.tags || '').toLowerCase().includes(searchLower) ||
        (item.payment_method || '').toLowerCase().includes(searchLower) ||
        (item.amount || '').toString().includes(searchLower)
      );
    }

    // Apply category filter
    if (appliedFilters.category) {
      filtered = filtered.filter(item => item.category_id === parseInt(appliedFilters.category));
    }

    // Apply payment method filter
    if (appliedFilters.payment_method) {
      filtered = filtered.filter(item => item.payment_method === appliedFilters.payment_method);
    }

    // Apply date range filter
    if (appliedFilters.date_from) {
      const fromDate = new Date(appliedFilters.date_from);
      filtered = filtered.filter(item => {
        if (!item.expense_date) return false;
        const itemDate = new Date(item.expense_date);
        return itemDate >= fromDate;
      });
    }

    if (appliedFilters.date_to) {
      const toDate = new Date(appliedFilters.date_to + 'T23:59:59');
      filtered = filtered.filter(item => {
        if (!item.expense_date) return false;
        const itemDate = new Date(item.expense_date);
        return itemDate <= toDate;
      });
    }

    // Apply amount range filter
    if (appliedFilters.min_amount) {
      const minAmount = parseFloat(appliedFilters.min_amount);
      filtered = filtered.filter(item => parseFloat(item.amount || 0) >= minAmount);
    }

    if (appliedFilters.max_amount) {
      const maxAmount = parseFloat(appliedFilters.max_amount);
      filtered = filtered.filter(item => parseFloat(item.amount || 0) <= maxAmount);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.expense_date || 0) - new Date(a.expense_date || 0));

    setItems(filtered);
  }, [appliedFilters, appliedSearch, originalItems, categories]);

  // Validate individual filters
  const validateFilters = useCallback((currentFilters) => {
    const validation = {
      category: { valid: true, message: "" },
      payment_method: { valid: true, message: "" },
      date_range: { valid: true, message: "" },
      amount_range: { valid: true, message: "" },
    };

    // Validate date range
    if (currentFilters.date_from && currentFilters.date_to) {
      const fromDate = new Date(currentFilters.date_from);
      const toDate = new Date(currentFilters.date_to);
      if (fromDate > toDate) {
        validation.date_range = {
          valid: false,
          message: "From date cannot be after To date"
        };
      }
    }

    // Validate amount range
    if (currentFilters.min_amount && currentFilters.max_amount) {
      const min = parseFloat(currentFilters.min_amount);
      const max = parseFloat(currentFilters.max_amount);
      if (min > max) {
        validation.amount_range = {
          valid: false,
          message: "Minimum amount cannot be greater than maximum"
        };
      }
    }

    // Validate negative amounts
    if (currentFilters.min_amount && parseFloat(currentFilters.min_amount) < 0) {
      validation.amount_range = {
        valid: false,
        message: "Amount cannot be negative"
      };
    }

    if (currentFilters.max_amount && parseFloat(currentFilters.max_amount) < 0) {
      validation.amount_range = {
        valid: false,
        message: "Amount cannot be negative"
      };
    }

    setFilterValidation(validation);
    return Object.values(validation).every(v => v.valid);
  }, []);

  // Load data from API
  async function load() {
    setLoading(true);
    setFilterError("");
    
    try {
      const res = await api.get('/expenses?limit=1000');
      
      if (res.data.success) {
        const data = res.data.data || [];
        // Process data to ensure category information is available
        const processedData = data.map(expense => {
          const categoryInfo = expense.category_name ? 
            { name: expense.category_name, color: expense.category_color || '#3498db' } : 
            getCategoryInfo(expense.category_id);
          
          return {
            ...expense,
            category_name: categoryInfo.name,
            category_color: categoryInfo.color
          };
        });
        
        setOriginalItems(processedData);
        setPagination(prev => ({
          ...prev,
          total: processedData.length
        }));
        
        setSelectedIds([]);
      } else {
        throw new Error(res.data.error?.message || "Failed to load expenses");
      }
    } catch (err) {
      console.error('Load expenses error:', err);
      
      if (err.response?.status === 400) {
        setFilterError("Invalid request. Please try again.");
      } else if (err.response?.status === 404) {
        setOriginalItems([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      } else if (err.response?.status >= 500) {
        setFilterError("Server error occurred. Please try again later.");
        toast.error("Server error. Please try again.");
      } else {
        setFilterError(err?.response?.data?.error?.message || "Could not load expenses");
        toast.error(err?.response?.data?.error?.message || "Could not load expenses");
      }
      
      setOriginalItems([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    }
    setLoading(false);
  }

  // Load categories from API
  async function loadCategories() {
    try {
      const res = await api.get("/categories");
      if (res.data.success) {
        const categoriesData = res.data.data || [];
        setCategories(categoriesData);
        
        // After loading categories, reload expenses to ensure proper category names
        if (originalItems.length > 0) {
          const updatedItems = originalItems.map(expense => {
            const categoryInfo = getCategoryInfo(expense.category_id);
            return {
              ...expense,
              category_name: categoryInfo.name,
              category_color: categoryInfo.color
            };
          });
          setOriginalItems(updatedItems);
        }
      }
    } catch (err) {
      console.error('Load categories error:', err);
      setCategories([]);
      toast.error("Failed to load categories");
    }
  }

  // Handle individual filter changes with validation
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    validateFilters(newFilters);
  };

  // Apply search
  const handleSearchSubmit = () => {
    setIsFiltering(true);
    setAppliedSearch(search);
    setTimeout(() => setIsFiltering(false), 300);
  };

  // Handle search on Enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Clear search specifically
  const clearSearch = () => {
    setSearch("");
    setAppliedSearch("");
  };

  // Apply filters with validation
  const applyFilters = () => {
    if (!validateFilters(filters)) {
      toast.error("Please fix filter validation errors before applying");
      return;
    }

    setIsFiltering(true);
    setAppliedFilters({ ...filters });
    setTimeout(() => setIsFiltering(false), 300);
  };

  // Clear individual filter
  const clearIndividualFilter = (filterKey) => {
    const newFilters = { ...filters, [filterKey]: "" };
    const newAppliedFilters = { ...appliedFilters, [filterKey]: "" };
    
    setFilters(newFilters);
    setAppliedFilters(newAppliedFilters);
  };

  // Clear all filters and search
  const clearAllFilters = () => {
    const emptyFilters = {
      category: "",
      payment_method: "",
      date_from: "",
      date_to: "",
      min_amount: "",
      max_amount: "",
    };
    
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearch("");
    setAppliedSearch("");
    setSelectedIds([]);
    setFilterError("");
    setFilterValidation({
      category: { valid: true, message: "" },
      payment_method: { valid: true, message: "" },
      date_range: { valid: true, message: "" },
      amount_range: { valid: true, message: "" },
    });
  };

  // File validation helper
  const validateFile = (file) => {
    if (!file) return true;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return false;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/gif",
      "application/pdf"
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, GIF, and PDF files are allowed");
      return false;
    }

    return true;
  };

  // Handle file change with validation
  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFile(file)) {
      e.target.value = '';
      return;
    }

    if (isEdit) {
      setEditForm({ ...editForm, receipt: file });
    } else {
      setForm({ ...form, receipt: file });
    }
  };

  async function add(e) {
    e.preventDefault();
    
    if (!form.category_id || !form.amount || !form.description || !form.expense_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const fd = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== '') {
          fd.append(key, form[key]);
        }
      });

      const response = await api.post("/expenses", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success("Expense added successfully!");
        setForm({
          category_id: "",
          amount: "",
          description: "",
          payment_method: "cash",
          expense_date: "",
          tags: "",
          receipt: null,
        });
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        setShowAddForm(false);
        await load(); // Reload data
      } else {
        toast.error(response.data.error?.message || "Failed to add expense");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err?.response?.data?.error?.message || "Failed to add expense";
      toast.error(errorMessage);
    }
  }

  async function update(e) {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.keys(editForm).forEach((key) => {
        if (editForm[key] !== null && editForm[key] !== '') {
          fd.append(key, editForm[key]);
        }
      });

      const response = await api.put(`/expenses/${editItem.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success("Expense updated successfully!");
        setEditItem(null);
        setEditForm({});
        await load(); // Reload data
      } else {
        toast.error(response.data.error?.message || "Failed to update expense");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err?.response?.data?.error?.message || "Failed to update expense";
      toast.error(errorMessage);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this expense?")) return;
    try {
      const response = await api.delete(`/expenses/${id}`);
      if (response.data.success) {
        toast.success("Expense deleted successfully");
        await load();
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  }

  async function removeSelected() {
    if (selectedIds.length === 0) {
      toast.info("No expenses selected");
      return;
    }
    if (!window.confirm(`Delete ${selectedIds.length} selected expenses?`))
      return;
    try {
      const response = await api.post("/expenses/bulk-delete", {
        ids: selectedIds
      });
      
      if (response.data.success) {
        toast.success("Selected expenses deleted");
        setSelectedIds([]);
        await load();
      } else {
        toast.error(response.data.error?.message || "Bulk delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Bulk delete failed");
    }
  }

  // Export filtered CSV
  async function exportCSV() {
    try {
      if (items.length === 0) {
        toast.info("No data to export");
        return;
      }

      const csvContent = generateCSV(items);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Expenses exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    }
  }

  // Generate CSV content
  const generateCSV = (data) => {
    const headers = ['Date', 'Amount', 'Description', 'Category', 'Payment Method', 'Tags'];
    const csvRows = [headers.join(',')];
    
    data.forEach(item => {
      const categoryInfo = getCategoryInfo(item.category_id);
      const categoryName = item.category_name || categoryInfo.name;
      
      const row = [
        item.expense_date ? new Date(item.expense_date).toLocaleDateString() : '',
        parseFloat(item.amount || 0).toFixed(2),
        `"${(item.description || '').replace(/"/g, '""')}"`,
        `"${categoryName.replace(/"/g, '""')}"`,
        item.payment_method || '',
        `"${(item.tags || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  // Generate receipt URL
  const getReceiptUrl = (receiptPath) => {
    if (!receiptPath) return null;
    
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    
    if (receiptPath.startsWith('uploads/')) {
      return `${baseUrl}/${receiptPath}`;
    }
    
    return `${baseUrl}/${receiptPath}`;
  };

  // Calculate statistics (using current filtered items)
  const stats = {
    total: items.reduce((sum, it) => sum + parseFloat(it.amount || 0), 0),
    count: items.length,
    avgPerDay: items.length > 0 ? 
      items.reduce((sum, it) => sum + parseFloat(it.amount || 0), 0) / 
      Math.max(1, new Set(items.map(it => it.expense_date?.split('T')[0]).filter(Boolean)).size) : 0,
    byCategory: items.reduce((acc, it) => {
      const categoryInfo = getCategoryInfo(it.category_id);
      const cat = it.category_name || categoryInfo.name;
      acc[cat] = (acc[cat] || 0) + parseFloat(it.amount || 0);
      return acc;
    }, {}),
    byPaymentMethod: items.reduce((acc, it) => {
      const method = it.payment_method || "unknown";
      acc[method] = (acc[method] || 0) + parseFloat(it.amount || 0);
      return acc;
    }, {}),
  };

  // Group by date
  const groupedByDate = items.reduce((acc, it) => {
    if (!it.expense_date) return acc;
    const d = new Date(it.expense_date).toLocaleDateString();
    acc[d] = acc[d] || [];
    acc[d].push(it);
    return acc;
  }, {});

  // Group by category
  const groupedByCategory = items.reduce((acc, it) => {
    const categoryInfo = getCategoryInfo(it.category_id);
    const c = it.category_name || categoryInfo.name;
    acc[c] = acc[c] || [];
    acc[c].push(it);
    return acc;
  }, {});

  // Check if any filters are active
  const hasActiveSearch = appliedSearch && appliedSearch.trim();
  const hasActiveFilters = Object.values(appliedFilters).some(value => value && value.toString().trim());
  const hasAnyActiveFilters = hasActiveSearch || hasActiveFilters;

  // Get active filter tags
  const getActiveFilterTags = () => {
    const tags = [];
    
    if (hasActiveSearch) {
      tags.push({
        type: 'search',
        label: `Search: "${appliedSearch}"`,
        onRemove: clearSearch
      });
    }
    
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value && value.toString().trim()) {
        let label = '';
        switch (key) {
          case 'category':
            const cat = categories.find(c => c.id === parseInt(value));
            label = `Category: ${cat?.name || 'Unknown'}`;
            break;
          case 'payment_method':
            label = `Payment: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
            break;
          case 'date_from':
            label = `From: ${value}`;
            break;
          case 'date_to':
            label = `To: ${value}`;
            break;
          case 'min_amount':
            label = `Min: ₹${value}`;
            break;
          case 'max_amount':
            label = `Max: ₹${value}`;
            break;
        }
        if (label) {
          tags.push({
            type: 'filter',
            key,
            label,
            onRemove: () => clearIndividualFilter(key)
          });
        }
      }
    });
    
    return tags;
  };

  // Get appropriate no-data message
  const getNoDataMessage = () => {
    if (hasAnyActiveFilters) {
      return {
        title: "No expenses match your criteria",
        subtitle: "Try adjusting your search terms or filters to see more results",
        showClearFilters: true
      };
    } else {
      return {
        title: "No expenses found",
        subtitle: "Start by adding your first expense to get started",
        showClearFilters: false
      };
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-blue-600">Expense Tracker</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            Add Expense
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <TrendingUp size={16} />
            Stats
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            disabled={items.length === 0}
          >
            <Download size={16} />
            Export ({items.length})
          </button>
          <button
            onClick={() => load()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ADD FORM */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Add New Expense</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
          
          <form
            onSubmit={add}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Amount"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />

            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />

            <select
              value={form.payment_method}
              onChange={(e) =>
                setForm({ ...form, payment_method: e.target.value })
              }
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="netbanking">Netbanking</option>
              <option value="wallet">Wallet</option>
            </select>

            <input
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />

            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Tags (comma separated)"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="relative">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, false)}
                className="p-3 border border-gray-300 rounded-lg w-full"
                accept="image/*,application/pdf"
              />
              {form.receipt && (
                <div className="absolute -top-2 -right-2">
                  <CheckCircle className="text-green-500" size={20} />
                </div>
              )}
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                <Plus size={18} /> Add Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STATISTICS */}
      {showStats && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Statistics {hasAnyActiveFilters && "(Filtered)"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee className="text-blue-600" size={20} />
                <span className="text-sm text-gray-600">Total Amount</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">₹{stats.total.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-green-600" size={20} />
                <span className="text-sm text-gray-600">Total Expenses</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.count}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-purple-600" size={20} />
                <span className="text-sm text-gray-600">Avg Per Day</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">₹{stats.avgPerDay.toFixed(2)}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="text-orange-600" size={20} />
                <span className="text-sm text-gray-600">Categories</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{Object.keys(stats.byCategory).length}</div>
            </div>
          </div>
          
          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">By Category</h3>
              <div className="space-y-2">
                {Object.keys(stats.byCategory).length > 0 ? (
                  Object.entries(stats.byCategory)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm font-bold text-green-600">₹{amount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">No data available</div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">By Payment Method</h3>
              <div className="space-y-2">
                {Object.keys(stats.byPaymentMethod).length > 0 ? (
                  Object.entries(stats.byPaymentMethod)
                    .sort(([,a], [,b]) => b - a)
                    .map(([method, amount]) => (
                    <div key={method} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium capitalize">{method}</span>
                      <span className="text-sm font-bold text-green-600">₹{amount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">No data available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH + FILTERS + VIEW SWITCH */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6">
        <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-12 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={handleSearchSubmit}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800"
                  title="Search"
                >
                  <Search size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Filter size={16} />
              Filters
              {hasAnyActiveFilters && (
                <span className="bg-red-500 text-white text-xs rounded-full w-2 h-2"></span>
              )}
            </button>
          </div>
          
          <div className="flex gap-2 w-full lg:w-auto">
            {['list', 'date', 'category'].map(viewType => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-medium capitalize transition ${
                  view === viewType 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {viewType === 'date' ? 'Date-wise' : viewType === 'category' ? 'Category-wise' : 'List'}
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE FILTER TAGS */}
        {hasAnyActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {getActiveFilterTags().map((tag, index) => (
                <span
                  key={`${tag.type}-${tag.key || 'search'}-${index}`}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {tag.label}
                  <button
                    onClick={tag.onRemove}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Showing {items.length} of {originalItems.length} expenses
            </div>
          </div>
        )}

        {/* ADVANCED FILTERS */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className={`p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full ${
                    !filterValidation.category.valid ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {!filterValidation.category.valid && (
                  <p className="text-red-500 text-xs mt-1">{filterValidation.category.message}</p>
                )}
              </div>

              <div>
                <select
                  value={filters.payment_method}
                  onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                  className={`p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full ${
                    !filterValidation.payment_method.valid ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Netbanking</option>
                  <option value="wallet">Wallet</option>
                </select>
                {!filterValidation.payment_method.valid && (
                  <p className="text-red-500 text-xs mt-1">{filterValidation.payment_method.message}</p>
                )}
              </div>

              <div>
                <input
                  type="date"
                  placeholder="From Date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className={`p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full ${
                    !filterValidation.date_range.valid ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                <label className="text-xs text-gray-500">From Date</label>
              </div>

              <div>
                <input
                  type="date"
                  placeholder="To Date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className={`p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full ${
                    !filterValidation.date_range.valid ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                <label className="text-xs text-gray-500">To Date</label>
                {!filterValidation.date_range.valid && (
                  <p className="text-red-500 text-xs mt-1">{filterValidation.date_range.message}</p>
                )}
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Min Amount"
                  value={filters.min_amount}
                  onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                  className={`p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full ${
                    !filterValidation.amount_range.valid ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                <label className="text-xs text-gray-500">Minimum Amount</label>
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Max Amount"
                  value={filters.max_amount}
                  onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                  className={`p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full ${
                    !filterValidation.amount_range.valid ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                <label className="text-xs text-gray-500">Maximum Amount</label>
                {!filterValidation.amount_range.valid && (
                  <p className="text-red-500 text-xs mt-1">{filterValidation.amount_range.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={applyFilters}
                disabled={isFiltering || loading || !Object.values(filterValidation).every(v => v.valid)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isFiltering && <RefreshCw size={16} className="animate-spin" />}
                Apply Filters
              </button>
              <button
                onClick={clearAllFilters}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Clear All Filters
              </button>
              {Object.values(filterValidation).some(v => !v.valid) && (
                <div className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Fix validation errors to apply filters
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FILTER ERROR DISPLAY */}
      {filterError && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle size={20} />
            <span className="font-medium">Error:</span>
          </div>
          <p className="text-yellow-700 mt-1">{filterError}</p>
        </div>
      )}

      {/* BULK ACTIONS */}
      {selectedIds.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <span className="text-red-700 font-medium">
              {selectedIds.length} expense(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Clear Selection
              </button>
              <button
                onClick={removeSelected}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {(loading || isFiltering) && (
        <div className="text-center text-gray-500 py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">{isFiltering ? 'Applying filters...' : 'Loading expenses...'}</p>
        </div>
      )}

      {/* NO DATA STATE */}
      {!loading && !isFiltering && items.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          {(() => {
            const noDataMsg = getNoDataMessage();
            return (
              <>
                <p className="text-lg">{noDataMsg.title}</p>
                <p className="text-sm mb-4">{noDataMsg.subtitle}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {noDataMsg.showClearFilters ? (
                    <>
                      <button
                        onClick={clearAllFilters}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Clear All Filters
                      </button>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 justify-center"
                      >
                        <Plus size={16} />
                        Add New Expense
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
                    >
                      <Plus size={16} />
                      Add Your First Expense
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* CONTENT */}
      {!loading && !isFiltering && items.length > 0 && (
        <>
          {view === "list" ? (
            <>
              {/* List Header with Select All */}
              <div className="bg-white p-4 rounded-t-xl border-b border-gray-200 flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.length === items.length}
                  onChange={selectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  Select All ({items.length} items)
                  {hasAnyActiveFilters && (
                    <span className="text-gray-400"> - Filtered from {originalItems.length} total</span>
                  )}
                </span>
              </div>

              {/* List Items */}
              <div className="bg-white rounded-b-xl shadow-md">
                {items.map((it, index) => {
                  const categoryInfo = getCategoryInfo(it.category_id);
                  const categoryName = it.name || categoryInfo.name;
                  const categoryColor = it.category_color || categoryInfo.color;
                  
                  return (
                    <div
                      key={it.id}
                      className={`p-5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index === items.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(it.id)}
                            onChange={() => toggleSelect(it.id)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl font-bold text-green-600">
                                ₹{parseFloat(it.amount || 0).toFixed(2)}
                              </span>
                              <span 
                                className="text-sm text-white px-3 py-1 rounded-full font-medium"
                                style={{ backgroundColor: categoryColor }}
                              >
                                {categoryName}
                              </span>
                              <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full capitalize flex items-center gap-1">
                                <CreditCard size={12} /> {it.payment_method || 'unknown'}
                              </span>
                            </div>
                            
                            <div className="text-lg font-semibold text-gray-800 mb-1">
                              {it.description || 'No description'}
                            </div>
                            
                            <div className="text-sm text-gray-500 flex items-center gap-4 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {it.expense_date ? new Date(it.expense_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : 'No date'}
                              </span>
                              {it.tags && (
                                <span className="flex items-center gap-1">
                                  <Tag size={14} />
                                  {it.tags}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                Added: {it.created_at ? new Date(it.created_at).toLocaleDateString('en-IN') : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {it.receipt_path && (
                            <a
                              href={getReceiptUrl(it.receipt_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                              title="View Receipt"
                              onClick={(e) => {
                                if (!getReceiptUrl(it.receipt_path)) {
                                  e.preventDefault();
                                  toast.error("Receipt not available");
                                }
                              }}
                            >
                              <Eye size={16} />
                            </a>
                          )}
                          
                          <button
                            onClick={() => {
                              setEditItem(it);
                              setEditForm({
                                category_id: it.category_id || "",
                                amount: it.amount || "",
                                description: it.description || "",
                                payment_method: it.payment_method || "cash",
                                expense_date: it.expense_date ? it.expense_date.split("T")[0] : "",
                                tags: it.tags || "",
                                receipt: null,
                              });
                            }}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                            title="Edit Expense"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          <button
                            onClick={() => remove(it.id)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                            title="Delete Expense"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : view === "date" ? (
            <div className="space-y-6">
              {Object.keys(groupedByDate).length > 0 ? (
                Object.entries(groupedByDate)
                  .sort(([a], [b]) => new Date(b) - new Date(a))
                  .map(([date, exps]) => {
                    const dayTotal = exps.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
                    return (
                      <div key={date} className="bg-white p-5 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="font-bold text-xl text-blue-600">{date}</h2>
                          <div className="text-right">
                            <span className="text-lg font-bold text-green-600">₹{dayTotal.toFixed(2)}</span>
                            <span className="text-sm text-gray-500 block">{exps.length} expenses</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {exps.map((it) => {
                            const categoryInfo = getCategoryInfo(it.category_id);
                            const categoryName = it.name || categoryInfo.name;
                            const categoryColor = it.category_color || categoryInfo.color;
                            
                            return (
                              <div
                                key={it.id}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-green-600">₹{parseFloat(it.amount || 0).toFixed(2)}</span>
                                  <span className="font-medium">{it.description || 'No description'}</span>
                                  {it.receipt_path && (
                                    <a
                                      href={getReceiptUrl(it.receipt_path)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                      title="View Receipt"
                                    >
                                      <Eye size={12} />
                                    </a>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span 
                                    className="text-white px-2 py-1 rounded text-xs"
                                    style={{ backgroundColor: categoryColor }}
                                  >
                                    {categoryName}
                                  </span>
                                  <span className="capitalize">{it.payment_method || 'unknown'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-lg">No expenses to group by date</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedByCategory).length > 0 ? (
                Object.entries(groupedByCategory)
                  .sort(([, a], [, b]) => b.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0) - a.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0))
                  .map(([cat, exps]) => {
                    const categoryTotal = exps.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
                    // Get category color from the first expense in this category
                    const firstExp = exps[0];
                    const categoryInfo = getCategoryInfo(firstExp?.category_id);
                    const categoryColor = firstExp?.category_color || categoryInfo.color;
                    
                    return (
                      <div key={cat} className="bg-white p-5 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <h2 className="font-bold text-xl text-blue-600">{cat}</h2>
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: categoryColor }}
                              title={`Category color: ${categoryColor}`}
                            ></div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-green-600">₹{categoryTotal.toFixed(2)}</span>
                            <span className="text-sm text-gray-500 block">{exps.length} expenses</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {exps.map((it) => (
                            <div
                              key={it.id}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-green-600">₹{parseFloat(it.amount || 0).toFixed(2)}</span>
                                <span className="font-medium">{it.description || 'No description'}</span>
                                {it.receipt_path && (
                                  <a
                                    href={getReceiptUrl(it.receipt_path)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                    title="View Receipt"
                                  >
                                    <Eye size={12} />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="capitalize">{it.payment_method || 'unknown'}</span>
                                <span>{it.expense_date ? new Date(it.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No date'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-lg">No expenses to group by category</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-600">
                Edit Expense
              </h2>
              <button
                onClick={() => setEditItem(null)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={update} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={editForm.category_id}
                onChange={(e) =>
                  setEditForm({ ...editForm, category_id: e.target.value })
                }
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm({ ...editForm, amount: e.target.value })
                }
                placeholder="Amount"
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <input
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Description"
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2"
                required
              />

              <select
                value={editForm.payment_method}
                onChange={(e) =>
                  setEditForm({ ...editForm, payment_method: e.target.value })
                }
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="netbanking">Netbanking</option>
                <option value="wallet">Wallet</option>
              </select>

              <input
                type="date"
                value={editForm.expense_date}
                onChange={(e) =>
                  setEditForm({ ...editForm, expense_date: e.target.value })
                }
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <input
                value={editForm.tags}
                onChange={(e) =>
                  setEditForm({ ...editForm, tags: e.target.value })
                }
                placeholder="Tags (comma separated)"
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2"
              />

              <div className="relative md:col-span-2">
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, true)}
                  className="p-3 border border-gray-300 rounded-lg w-full"
                  accept="image/*,application/pdf"
                />
                {editItem.receipt_path && (
                  <p className="text-sm text-gray-500 mt-1">
                    Current receipt: <a 
                      href={getReceiptUrl(editItem.receipt_path)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {editItem.receipt_path.split('/').pop()}
                    </a>
                  </p>
                )}
                {editForm.receipt && (
                  <div className="absolute -top-2 -right-2">
                    <CheckCircle className="text-green-500" size={20} />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  <Check size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}