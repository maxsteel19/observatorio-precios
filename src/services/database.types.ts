// Tipos generados desde el esquema real de Supabase (herramienta generate_typescript_types).
// Regenerar después de cada migración: npx supabase gen types typescript --project-id cygqzrdeofngskjwmrir

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      auditoria: {
        Row: {
          detalle: string;
          fecha: string;
          id: number;
          operacion: string;
          registro_id: string | null;
          tabla: string;
          usuario_id: string | null;
          usuario_nombre: string;
        };
        Insert: {
          detalle?: string;
          fecha?: string;
          id?: never;
          operacion: string;
          registro_id?: string | null;
          tabla: string;
          usuario_id?: string | null;
          usuario_nombre: string;
        };
        Update: {
          detalle?: string;
          fecha?: string;
          id?: never;
          operacion?: string;
          registro_id?: string | null;
          tabla?: string;
          usuario_id?: string | null;
          usuario_nombre?: string;
        };
        Relationships: [];
      };
      capturas: {
        Row: {
          creado_en: string;
          fiscalizador_id: string | null;
          id: number;
          modo: Database['public']['Enums']['modo_captura'];
          sucursal_id: number;
        };
        Insert: {
          creado_en?: string;
          fiscalizador_id?: string | null;
          id?: number;
          modo: Database['public']['Enums']['modo_captura'];
          sucursal_id: number;
        };
        Update: {
          creado_en?: string;
          fiscalizador_id?: string | null;
          id?: number;
          modo?: Database['public']['Enums']['modo_captura'];
          sucursal_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'capturas_fiscalizador_id_fkey';
            columns: ['fiscalizador_id'];
            isOneToOne: false;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'capturas_sucursal_id_fkey';
            columns: ['sucursal_id'];
            isOneToOne: false;
            referencedRelation: 'sucursales';
            referencedColumns: ['id'];
          },
        ];
      };
      categorias: {
        Row: { id: string; nombre: string };
        Insert: { id: string; nombre: string };
        Update: { id?: string; nombre?: string };
        Relationships: [];
      };
      comercios: {
        Row: {
          creado_en: string;
          id: number;
          nombre: string;
          propietario_id: string | null;
          rut_empresa: string | null;
          tipo: Database['public']['Enums']['tipo_comercio'];
        };
        Insert: {
          creado_en?: string;
          id?: number;
          nombre: string;
          propietario_id?: string | null;
          rut_empresa?: string | null;
          tipo: Database['public']['Enums']['tipo_comercio'];
        };
        Update: {
          creado_en?: string;
          id?: number;
          nombre?: string;
          propietario_id?: string | null;
          rut_empresa?: string | null;
          tipo?: Database['public']['Enums']['tipo_comercio'];
        };
        Relationships: [
          {
            foreignKeyName: 'comercios_propietario_id_fkey';
            columns: ['propietario_id'];
            isOneToOne: false;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
        ];
      };
      eventos_app: {
        Row: {
          duracion_ms: number | null;
          fecha: string;
          id: number;
          mensaje: string | null;
          nivel: string;
          operacion: string;
          plataforma: string | null;
          usuario_id: string | null;
          version_app: string | null;
        };
        Insert: {
          duracion_ms?: number | null;
          fecha?: string;
          id?: never;
          mensaje?: string | null;
          nivel: string;
          operacion: string;
          plataforma?: string | null;
          usuario_id?: string | null;
          version_app?: string | null;
        };
        Update: {
          duracion_ms?: number | null;
          fecha?: string;
          id?: never;
          mensaje?: string | null;
          nivel?: string;
          operacion?: string;
          plataforma?: string | null;
          usuario_id?: string | null;
          version_app?: string | null;
        };
        Relationships: [];
      };
      perfiles: {
        Row: {
          activo: boolean;
          creado_en: string;
          email: string;
          id: string;
          nombre: string;
          rol: Database['public']['Enums']['rol_usuario'];
        };
        Insert: {
          activo?: boolean;
          creado_en?: string;
          email: string;
          id: string;
          nombre: string;
          rol: Database['public']['Enums']['rol_usuario'];
        };
        Update: {
          activo?: boolean;
          creado_en?: string;
          email?: string;
          id?: string;
          nombre?: string;
          rol?: Database['public']['Enums']['rol_usuario'];
        };
        Relationships: [];
      };
      precios: {
        Row: {
          captura_id: number | null;
          es_oferta: boolean;
          fuente: Database['public']['Enums']['fuente_precio'];
          id: number;
          oferta_hasta: string | null;
          precio: number;
          producto_id: string;
          registrado_en: string;
          registrado_por: string | null;
          sucursal_id: number;
        };
        Insert: {
          captura_id?: number | null;
          es_oferta?: boolean;
          fuente: Database['public']['Enums']['fuente_precio'];
          id?: number;
          oferta_hasta?: string | null;
          precio: number;
          producto_id: string;
          registrado_en?: string;
          registrado_por?: string | null;
          sucursal_id: number;
        };
        Update: {
          captura_id?: number | null;
          es_oferta?: boolean;
          fuente?: Database['public']['Enums']['fuente_precio'];
          id?: number;
          oferta_hasta?: string | null;
          precio?: number;
          producto_id?: string;
          registrado_en?: string;
          registrado_por?: string | null;
          sucursal_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'precios_captura_id_fkey';
            columns: ['captura_id'];
            isOneToOne: false;
            referencedRelation: 'capturas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'precios_producto_id_fkey';
            columns: ['producto_id'];
            isOneToOne: false;
            referencedRelation: 'productos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'precios_registrado_por_fkey';
            columns: ['registrado_por'];
            isOneToOne: false;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'precios_sucursal_id_fkey';
            columns: ['sucursal_id'];
            isOneToOne: false;
            referencedRelation: 'sucursales';
            referencedColumns: ['id'];
          },
        ];
      };
      productos: {
        Row: {
          activo: boolean;
          categoria_id: string;
          creado_en: string;
          id: string;
          marca: string | null;
          nombre: string;
          palabras_clave: string[];
          unidad: string;
        };
        Insert: {
          activo?: boolean;
          categoria_id: string;
          creado_en?: string;
          id: string;
          marca?: string | null;
          nombre: string;
          palabras_clave?: string[];
          unidad: string;
        };
        Update: {
          activo?: boolean;
          categoria_id?: string;
          creado_en?: string;
          id?: string;
          marca?: string | null;
          nombre?: string;
          palabras_clave?: string[];
          unidad?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'productos_categoria_id_fkey';
            columns: ['categoria_id'];
            isOneToOne: false;
            referencedRelation: 'categorias';
            referencedColumns: ['id'];
          },
        ];
      };
      reportes: {
        Row: {
          comentario: string;
          creado_en: string;
          estado: Database['public']['Enums']['estado_reporte'];
          id: number;
          motivo: string;
          sucursal_id: number;
        };
        Insert: {
          comentario?: string;
          creado_en?: string;
          estado?: Database['public']['Enums']['estado_reporte'];
          id?: number;
          motivo: string;
          sucursal_id: number;
        };
        Update: {
          comentario?: string;
          creado_en?: string;
          estado?: Database['public']['Enums']['estado_reporte'];
          id?: number;
          motivo?: string;
          sucursal_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'reportes_sucursal_id_fkey';
            columns: ['sucursal_id'];
            isOneToOne: false;
            referencedRelation: 'sucursales';
            referencedColumns: ['id'];
          },
        ];
      };
      solicitudes_comerciante: {
        Row: {
          comercio: string;
          creado_en: string;
          email: string;
          estado: Database['public']['Enums']['estado_solicitud'];
          id: number;
          nombre: string;
          revisado_en: string | null;
          revisado_por: string | null;
          rut: string;
          rut_empresa: string;
          telefono: string;
          tipo: Database['public']['Enums']['tipo_comercio'];
          usuario_id: string | null;
        };
        Insert: {
          comercio: string;
          creado_en?: string;
          email: string;
          estado?: Database['public']['Enums']['estado_solicitud'];
          id?: number;
          nombre: string;
          revisado_en?: string | null;
          revisado_por?: string | null;
          rut: string;
          rut_empresa: string;
          telefono: string;
          tipo: Database['public']['Enums']['tipo_comercio'];
          usuario_id?: string | null;
        };
        Update: {
          comercio?: string;
          creado_en?: string;
          email?: string;
          estado?: Database['public']['Enums']['estado_solicitud'];
          id?: number;
          nombre?: string;
          revisado_en?: string | null;
          revisado_por?: string | null;
          rut?: string;
          rut_empresa?: string;
          telefono?: string;
          tipo?: Database['public']['Enums']['tipo_comercio'];
          usuario_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'solicitudes_comerciante_revisado_por_fkey';
            columns: ['revisado_por'];
            isOneToOne: false;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'solicitudes_comerciante_usuario_id_fkey';
            columns: ['usuario_id'];
            isOneToOne: true;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
        ];
      };
      sucursales: {
        Row: {
          activa: boolean;
          beneficio_tarjeta_vecina: string | null;
          comercio_id: number;
          creado_en: string;
          direccion: string;
          horario: string;
          id: number;
          lat: number;
          lng: number;
          mapa_x: number;
          mapa_y: number;
          nombre_sucursal: string | null;
          telefono: string | null;
        };
        Insert: {
          activa?: boolean;
          beneficio_tarjeta_vecina?: string | null;
          comercio_id: number;
          creado_en?: string;
          direccion: string;
          horario?: string;
          id?: number;
          lat: number;
          lng: number;
          mapa_x?: number;
          mapa_y?: number;
          nombre_sucursal?: string | null;
          telefono?: string | null;
        };
        Update: {
          activa?: boolean;
          beneficio_tarjeta_vecina?: string | null;
          comercio_id?: number;
          creado_en?: string;
          direccion?: string;
          horario?: string;
          id?: number;
          lat?: number;
          lng?: number;
          mapa_x?: number;
          mapa_y?: number;
          nombre_sucursal?: string | null;
          telefono?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sucursales_comercio_id_fkey';
            columns: ['comercio_id'];
            isOneToOne: false;
            referencedRelation: 'comercios';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      precios_vigentes: {
        Row: {
          es_oferta: boolean | null;
          fuente: Database['public']['Enums']['fuente_precio'] | null;
          id: number | null;
          oferta_hasta: string | null;
          precio: number | null;
          producto_id: string | null;
          registrado_en: string | null;
          sucursal_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'precios_producto_id_fkey';
            columns: ['producto_id'];
            isOneToOne: false;
            referencedRelation: 'productos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'precios_sucursal_id_fkey';
            columns: ['sucursal_id'];
            isOneToOne: false;
            referencedRelation: 'sucursales';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      aprobar_solicitud: { Args: { p_solicitud_id: number }; Returns: number };
      buscar_productos: {
        Args: { p_limite?: number; p_texto: string };
        Returns: Database['public']['Tables']['productos']['Row'][];
      };
      es_rut_valido: { Args: { rut: string }; Returns: boolean };
      rechazar_solicitud: { Args: { p_solicitud_id: number }; Returns: undefined };
      registrar_captura: {
        Args: { p_items: Json; p_modo: Database['public']['Enums']['modo_captura']; p_sucursal_id: number };
        Returns: number;
      };
      texto_busqueda: { Args: { texto: string }; Returns: string };
    };
    Enums: {
      estado_reporte: 'pendiente' | 'revisado' | 'descartado';
      estado_solicitud: 'pendiente' | 'aprobada' | 'rechazada';
      fuente_precio: 'fiscalizador' | 'ocr' | 'comerciante' | 'carga';
      modo_captura: 'ocr' | 'manual';
      rol_usuario: 'admin' | 'fiscalizador' | 'comerciante';
      tipo_comercio: 'minimarket' | 'almacen' | 'feria' | 'supermercado' | 'panaderia' | 'carniceria' | 'otro';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])> = (PublicSchema['Tables'] &
  PublicSchema['Views'])[T]['Row'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
