export interface FilterOption {
  field: string;
  label: string;
  type: 'date';
  visible: boolean;
}

export interface FilterValues {
  [key: string]: any;
}
