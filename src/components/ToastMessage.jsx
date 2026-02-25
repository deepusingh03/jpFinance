import React, { useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';

export default function ToastMessage({ toastDetails }) {
    const toastData = useRef(null);

    useEffect(() => {
        if (toastDetails && toastData.current) {
            toastData.current.show({
                severity: toastDetails.type,
                summary: toastDetails.label,
                detail: toastDetails.message,
                life: 3000
            });
        }
    }, [toastDetails]);

    return (
        <Toast ref={toastData} position="top-center" />
    );
}
