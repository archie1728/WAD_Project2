"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const UserAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trainers, setTrainers] = useState({});
    const [userID, setUserID] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!storedUser?._id) {
            router.push('/login');
        } else {
            setUserID(storedUser._id);
        }
    }, [router]);

    useEffect(() => {
        if (!userID) return;

        const fetchAppointments = async () => {
            try {
                const response = await fetch(`/api/appointments?userID=${userID}`);
                const data = await response.json();
                const userAppointments = data.filter(appointment => appointment.user._id === userID);
                setAppointments(userAppointments);

                const trainerPromises = data.map(appointment => 
                    appointment.trainer 
                        ? fetch(`/api/trainers/${appointment.trainer._id}`).then(res => res.json())
                        : Promise.resolve(null)
                );

                const trainersData = await Promise.all(trainerPromises);
                const trainersMap = {};
                trainersData.forEach((trainer, index) => {
                    const appointment = data[index];
                    trainersMap[appointment._id] = trainer ? trainer.name : "Trainer Unavailable";
                });

                setTrainers(trainersMap);
            } catch (error) {
                console.error('Error fetching appointments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [userID]);

    const handleDeleteAppointment = async (id) => {
        try {
            const response = await fetch(`/api/appointments/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setAppointments(appointments.filter(appointment => appointment._id !== id));
            } else {
                const errorData = await response.json();
                console.error('Error deleting appointment:', errorData.message);
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <Navbar pageTitle="My Appointments" />
            <div className="container mx-auto p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>My Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {appointments.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Trainer</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appointments.map((appointment) => (
                                        <TableRow key={appointment._id}>
                                            <TableCell>{trainers[appointment._id] || 'Trainer Unavailable'}</TableCell>
                                            <TableCell>{new Date(appointment.date).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={appointment.status === 'Completed' ? 'success' : 'default'}>
                                                    {appointment.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {appointment.status !== 'Completed' && (
                                                    <Button variant="destructive" onClick={() => handleDeleteAppointment(appointment._id)}>
                                                        Delete
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p>No appointments found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UserAppointments;