import { useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";
import { FaEdit, FaTrashAlt, FaGift, FaPlus } from "react-icons/fa";
import "./Recompensas.css";

export default function Recompensas() {
  const [recompensas, setRecompensas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Formulario
  const [titulo, setTitulo] = useState("");
  const [clave, setClave] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puntos, setPuntos] = useState<number>(0);
  const [stock, setStock] = useState<number | null>(null);
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [recompensaIdEditando, setRecompensaIdEditando] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const { data: recs } = await supabase
      .from("recompensas")
      .select("*, categoria:recompensas_categorias(nombre)")
      .order("titulo");

    const { data: cats } = await supabase.from("recompensas_categorias").select("*");

    setRecompensas(recs || []);
    setCategorias(cats || []);
  };

  // ---------------------------
  // Modal Nueva recompensa
  // ---------------------------
  const abrirModalNueva = () => {
    setModoEdicion(false);
    limpiarFormulario();
    setMostrarModal(true);
  };

  const abrirModalEditar = (r: any) => {
    setModoEdicion(true);
    setRecompensaIdEditando(r.id);
    setTitulo(r.titulo);
    setClave(r.clave);
    setCategoriaId(r.categoria_id);
    setDescripcion(r.descripcion || "");
    setPuntos(r.puntos_costo);
    setStock(r.stock);

    setPreview(r.imagen_url || null);
    setImagen(null);

    setMostrarModal(true);
  };


  const limpiarFormulario = () => {
    setTitulo("");
    setClave("");
    setCategoriaId("");
    setDescripcion("");
    setPuntos(0);
    setStock(null);
    setImagen(null);
    setPreview(null);
  };

  const guardarRecompensa = async (e: any) => {
    e.preventDefault();

    let imagenUrl = preview; 

    if (imagen) {
      const nombre = `imagenes/rec_${Date.now()}_${imagen.name}`;


      const { error: uploadError } = await supabase.storage
        .from("recompensas")
        .upload(nombre, imagen, {
          upsert: false, 
        });

    if (uploadError) {
      console.error("ERROR STORAGE:", uploadError);
      alert("Error subiendo imagen: " + uploadError.message);
      return;
    }

      // Obtener URL pública
      const { data } = supabase.storage
        .from("recompensas")
        .getPublicUrl(nombre);

      imagenUrl = data.publicUrl;
    }

    const datos = {
      titulo,
      clave,
      categoria_id: categoriaId || null,
      descripcion,
      puntos_costo: puntos,
      stock: stock === null ? null : Number(stock),
      imagen_url: imagenUrl,
      activo: true
    };

    if (modoEdicion && recompensaIdEditando) {
      await supabase.from("recompensas").update(datos).eq("id", recompensaIdEditando);
    } else {
      await supabase.from("recompensas").insert([datos]);
    }

    await cargarDatos();
    setMostrarModal(false);
  };

  const eliminarRecompensa = async (id: string) => {
    if (!confirm("¿Eliminar recompensa?")) return;

    await supabase.from("recompensas").delete().eq("id", id);
    cargarDatos();
  };

  const toggleEstado = async (r: any) => {
    await supabase
      .from("recompensas")
      .update({ activo: !r.activo })
      .eq("id", r.id);

    cargarDatos();
  };

  return (
    <div className="recompensas-container">
      <div className="header">
        <h2><FaGift /> Gestión de Recompensas</h2>
        <button className="btn-agregar" onClick={abrirModalNueva}>
          <FaPlus /> Agregar recompensa
        </button>
      </div>

      {/* ================= TABLA ================= */}
      <div className="tabla">
        <table>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Título</th>
              <th>Clave</th>
              <th>Categoría</th>
              <th>Puntos</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {recompensas.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.imagen_url ? (
                    <img src={r.imagen_url} className="img-recompensa" />
                  ) : (
                    "—"
                  )}
                </td>

                <td>{r.titulo}</td>
                <td>{r.clave}</td>
                <td>{r.categoria?.nombre || "Sin categoría"}</td>
                <td>{r.puntos_costo}</td>
                <td>{r.stock ?? "∞"}</td>

                <td>
                  <span className={r.activo ? "estado-activo" : "estado-inactivo"}>
                    {r.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>

                <td className="acciones">
                  <button className="btn-edit" onClick={() => abrirModalEditar(r)}><FaEdit /></button>
                  <button className="btn-toggle" onClick={() => toggleEstado(r)}>
                    {r.activo ? "Inactivar" : "Activar"}
                  </button>
                  <button className="btn-delete" onClick={() => eliminarRecompensa(r.id)}>
                    <FaTrashAlt />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{modoEdicion ? "Editar Recompensa" : "Nueva Recompensa"}</h3>

          <form onSubmit={guardarRecompensa} className="form-grid">
              
              <div className="form-group">
                <label className="form-label">Título de la recompensa</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Clave interna</label>
                <input value={clave} onChange={(e) => setClave(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Puntos necesarios</label>
                <input type="number" value={puntos} onChange={(e) => setPuntos(Number(e.target.value))} required />
              </div>

              <div className="form-group full">
                <label className="form-label">Descripción</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Stock</label>
                <input type="number" value={stock ?? ""} onChange={(e) => setStock(e.target.value === "" ? null : Number(e.target.value))} />
              </div>

              <div className="form-group">
                <label className="form-label">Imagen</label>
                <input type="file" accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImagen(file);
                    setPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
              </div>

              <div className="form-group full">
                {preview && <img src={preview} className="preview-img" />}
              </div>

              <div className="modal-buttons full">
                <button type="submit">Guardar</button>
                <button type="button" className="btn-delete" onClick={() => setMostrarModal(false)}>Cancelar</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
