$connString = "Server=KaiVetDB.mssql.somee.com;Database=KaiVetDB;User Id=Josephbv_SQLLogin_1;Password=Joshell27.;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT id_cliente, nombre FROM cliente; SELECT id_mascota, nombre, id_cliente FROM mascotas"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$ds = New-Object System.Data.DataSet
$adapter.Fill($ds)
$conn.Close()

Write-Host "--- CLIENTES ---"
$ds.Tables[0] | Format-Table -AutoSize

Write-Host "--- MASCOTAS ---"
$ds.Tables[1] | Format-Table -AutoSize
