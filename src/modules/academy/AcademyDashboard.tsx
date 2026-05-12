import React, { useState, useEffect } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { getStudents, addStudent, updateStudent, deleteStudent } from "../../services/studentService";

const AcademyDashboard: React.FC = () => {
  const { business } = useBusiness();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof business?.businessId === "string") {
      fetchStudents();
    }
    // eslint-disable-next-line
  }, [business]);

  const fetchStudents = async () => {
    if (typeof business?.businessId !== "string") {
      return;
    }

    setLoading(true);
    try {
      const data = await getStudents(business.businessId);
      setStudents(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  // Add, edit, delete handlers would go here

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Academy Dashboard</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div>
          <div className="mb-4">Total Students: {students.length}</div>
          {/* Table of students */}
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Course</th>
                <th className="border px-2 py-1">Phone</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="border px-2 py-1">{student.studentName}</td>
                  <td className="border px-2 py-1">{student.courseName}</td>
                  <td className="border px-2 py-1">{student.phone}</td>
                  <td className="border px-2 py-1">{student.email}</td>
                  <td className="border px-2 py-1">
                    {/* Edit/Delete buttons here */}
                    <button className="text-blue-600 mr-2">Edit</button>
                    <button className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AcademyDashboard;
