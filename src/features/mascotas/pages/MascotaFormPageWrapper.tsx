import React from 'react';
import { MascotaFormPage } from './MascotaFormPage';
import { useMascotas, Mascota } from '../hooks/useMascotas';

interface MascotaFormPageWrapperProps {
    onBack: () => void;
    onSuccess: () => void;
    mascota?: Mascota | null;
    readOnly?: boolean;
}

export const MascotaFormPageWrapper: React.FC<MascotaFormPageWrapperProps> = (props) => {
    const { crearMascota, actualizarMascota, loading } = useMascotas();

    const handleSubmit = async (data: Partial<Mascota>) => {
        if (data.id_mascota) {
            return await actualizarMascota(data.id_mascota, data);
        } else {
            return await crearMascota(data);
        }
    };

    return (
        <MascotaFormPage
            {...props}
            onSubmit={handleSubmit}
            loading={loading}
        />
    );
};
