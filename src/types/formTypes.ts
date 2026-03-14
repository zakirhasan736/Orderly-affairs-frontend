export interface FieldDefinition {
  key: string;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  multiple?: boolean;
  defaultValue?: string;
  inputType?: 'text' | 'password' | 'email' | 'number';
  conditionalOn?: string;
  conditionalValue?: string | string[] | boolean;

  conditionalDisplay?: {
    field: string;
    value: string | string[] | boolean;
  };

  content?: string;
}
export interface GroupDefinition {
  id: string;
  title: string;
  isRepeatable?: boolean;
  itemLabel?: string;
  description?: string;
  fields: FieldDefinition[];
}

export interface Subsection {
  id: string;
  title: string;
  description?: string;
  repeatable?: boolean;
  itemLabel?: string;
  fields?: FieldDefinition[];
  groups?: GroupDefinition[];
}

export interface Section {
  id: string;
  title: string;
  fields?: FieldDefinition[];
  description?: string;
  subsections: Subsection[];
}

export interface FormConfig {
  appName: string;
  version: string;
  chunks: {
    id: string;
    title: string;
    sections: Section[];
  }[];
}
