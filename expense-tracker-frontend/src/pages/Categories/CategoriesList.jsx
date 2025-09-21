import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { FaTrash, FaEdit, FaFolder } from "react-icons/fa";

export default function CategoriesList() {
  const [cats, setCats] = useState([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3498db");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await api.get("/categories");
      setCats(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load categories");
    }
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) {
        // Update
        await api.put(`/categories/${editing}`, { name, color_code: color });
        toast.success("Category updated");
        setEditing(null);
      } else {
        // Create
        await api.post("/categories", { name, color_code: color });
        toast.success("Category created");
      }
      setName("");
      setColor("#3498db");
      load();
    } catch (err) {
      const msg = err?.response?.data?.error?.message || "Save failed";
      toast.error(msg);
    }
  }

  async function del(id) {
    if (!window.confirm("Delete this category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted");
      load();
    } catch (err) {
      const msg = err?.response?.data?.error?.message || "Delete failed";
      toast.error(msg);
    }
  }

  function startEdit(c) {
    setName(c.name);
    setColor(c.color_code);
    setEditing(c.id);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Categories</h1>

      <form
        onSubmit={save}
        className="bg-white p-4 rounded shadow mb-6 flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category Name"
          className="p-2 border rounded flex-1"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="p-2 border rounded w-20"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          {editing ? "Update" : "Add"}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {cats.map((c) => (
          <div
            key={c.id}
            className="bg-white p-4 rounded shadow flex flex-col items-center text-center"
          >
            <FaFolder size={30} color={c.color_code} className="mb-2" />
            <div className="font-semibold">{c.name}</div>
            <div className="text-xs text-gray-500">
              {c.is_system ? "(system)" : c.created_at?.split("T")[0]}
            </div>
            {!c.is_system && (
              <div className="flex gap-3 mt-3">
                <FaEdit
                  className="text-blue-600 cursor-pointer"
                  onClick={() => startEdit(c)}
                />
                <FaTrash
                  className="text-red-600 cursor-pointer"
                  onClick={() => del(c.id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
