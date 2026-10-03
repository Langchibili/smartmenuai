"use client";

import SmartModal from "@/components/ui/smart-modal";

export function Modal({ children, footer, ...props }) {
  return (
    <SmartModal {...props}>
      {children}
      {footer && <SmartModal.Footer>{footer}</SmartModal.Footer>}
    </SmartModal>
  );
}
