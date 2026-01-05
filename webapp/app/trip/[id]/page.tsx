import TripDashboard from '@/components/trip/trip-dashboard';

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <TripDashboard id={id} />;
}
