using System;
using Microsoft.Data.SqlClient;

namespace DbTool
{
    class Program
    {
        static void Main(string[] args)
        {
            string connectionString = "Server=KaiVetDB.mssql.somee.com;Database=KaiVetDB;User Id=Josephbv_SQLLogin_1;Password=Joshell27.;TrustServerCertificate=True;";
            Console.WriteLine("Connecting to database...");

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                try
                {
                    connection.Open();
                    Console.WriteLine("Connection opened successfully.\n");

                    Console.WriteLine("--- Mascotas in Database ---");
                    using (SqlCommand cmd = new SqlCommand("SELECT id_mascota, nombre, fecha_creacion FROM Mascotas", connection))
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            int id = reader.GetInt32(0);
                            string name = reader.IsDBNull(1) ? "null" : reader.GetString(1);
                            string date = reader.IsDBNull(2) ? "null" : reader.GetDateTime(2).ToString("yyyy-MM-dd HH:mm:ss");
                            Console.WriteLine($"ID: {id}, Name: {name}, FechaCreacion: {date}");
                        }
                    }

                    Console.WriteLine("\n--- Updating null fecha_creacion to GETDATE() ---");
                    using (SqlCommand cmd = new SqlCommand("UPDATE Mascotas SET fecha_creacion = GETDATE() WHERE fecha_creacion IS NULL", connection))
                    {
                        int affected = cmd.ExecuteNonQuery();
                        Console.WriteLine($"Rows updated: {affected}");
                    }

                    Console.WriteLine("\n--- Mascotas in Database after update ---");
                    using (SqlCommand cmd = new SqlCommand("SELECT id_mascota, nombre, fecha_creacion FROM Mascotas", connection))
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            int id = reader.GetInt32(0);
                            string name = reader.IsDBNull(1) ? "null" : reader.GetString(1);
                            string date = reader.IsDBNull(2) ? "null" : reader.GetDateTime(2).ToString("yyyy-MM-dd HH:mm:ss");
                            Console.WriteLine($"ID: {id}, Name: {name}, FechaCreacion: {date}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error: {ex.Message}");
                }
            }
        }
    }
}
