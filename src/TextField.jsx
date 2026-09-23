// @ts-check
import React from "react";

/**
 * Shared native outlined field. Labels stay with the surrounding form label.
 * @param {({ multiline?: false } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> |
 * { multiline: true } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) & {
 * fullWidth?: boolean, variant?: 'outlined', size?: 'small'
 * }} props
 */
export default function TextField({
  fullWidth = true,
  variant = "outlined",
  size = "small",
  className = "",
  ...props
}) {
  const classes = `text-field ${fullWidth ? "field-full-width" : ""} field-${variant} field-${size} ${className}`;
  if (props.multiline === true) {
    const { multiline, ...fieldProps } = props;
    return <textarea {...fieldProps} className={classes} />;
  }
  const { multiline, ...fieldProps } = props;
  return <input {...fieldProps} className={classes} />;
}
