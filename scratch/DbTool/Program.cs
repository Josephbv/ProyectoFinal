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

                    Console.WriteLine("--- Clientes in Database ---");
                    using (SqlCommand cmd = new SqlCommand("SELECT id_cliente, nombre, correo, telefono, cedula FROM cliente", connection))
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            int id = reader.GetInt32(0);
                            string name = reader.IsDBNull(1) ? "null" : reader.GetString(1);
                            string email = reader.IsDBNull(2) ? "null" : reader.GetString(2);
                            string phone = reader.IsDBNull(3) ? "null" : reader.GetString(3);
                            string cedula = reader.IsDBNull(4) ? "null" : reader.GetString(4);
                            Console.WriteLine($"ID: {id} | Name: '{name}' | Email: '{email}' | Phone: '{phone}' | Cedula: '{cedula}'");
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
