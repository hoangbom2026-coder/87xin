import * as React from 'react'
import FormField from '../ui/FormField'

type InputProps = Omit<React.ComponentProps<typeof FormField>, 'as' | 'label'> & {
  label?: string
}

/** Input chuẩn — bọc `FormField` (label tùy chọn). */
const Input: React.FC<InputProps> = ({ label = '', ...props }) => (
  <FormField label={label} as="input" {...props} />
)

export default Input
