import useSWR from 'swr';
import { getTrip, TripResponse } from '@/lib/api';

export function useTrip(id: string) {
    const { data, error, isLoading, mutate } = useSWR<TripResponse>(
        id ? `/trips/${id}` : null,
        () => getTrip(id),
        {
            refreshInterval: (data) => {
                // If status is not 'done' or 'failed', poll every 2 seconds
                if (data?.video_source.status === 'pending' || data?.video_source.status === 'processing') {
                    return 2000;
                }
                return 0; // Stop polling
            }
        }
    );

    return {
        trip: data,
        isLoading,
        isError: error,
        mutate
    };
}
