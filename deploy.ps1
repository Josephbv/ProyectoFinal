Add-Type -AssemblyName System.Security

# 1. Decrypt password
$encryptedBase64 = "AQAAANCMnd8BFdERjHoAwE/Cl+sBAAAAHdfwlUTrdEW9Uvbg/9pmbAAAAAACAAAAAAAQZgAAAAEAACAAAABrG7YTF19BrJepBtlgL24A3/Vx/hHPkfOFEfv5mzve0gAAAAAOgAAAAAIAACAAAABXqcXKvIUgvg1X4dA/yNxdim48o9A6yqhfaI9JHIEZVSAAAAAtl/PYNA6HZykS+4yaxRAVcNAvpUMonsHa2hYFJOudZEAAAAD+ZUPsWilQ7VQBLobP2GXQGuPIOkMFcIAxoWJxJAYHjl1q6zBsx6j2hnMWZrvKyOnZyu2HkH8h2ZAWE8AYM41r"
$encryptedBytes = [System.Convert]::FromBase64String($encryptedBase64)
$decryptedBytes = [System.Security.Cryptography.ProtectedData]::Unprotect($encryptedBytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
$password = [System.Text.Encoding]::Unicode.GetString($decryptedBytes)

$ftpUser = "Josephbv"
$ftpUrl = "ftp://kaivetapi.somee.com/www.kaivetapi.somee.com"
$localPath = "c:\Users\equipo\Desktop\ApiKaivet\ApiKaivet\bin\Release\net8.0\publish"

# Helper function to create FTP directory recursively if not exists
function Create-FtpDirectory ($remoteDir) {
    $uri = "$ftpUrl/$remoteDir"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $password)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    try {
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "Created directory: $remoteDir"
    } catch {
        # Directory might already exist, ignore error
    }
}

# Helper function to upload a file
function Upload-FtpFile ($localFile, $remoteFile) {
    $uri = "$ftpUrl/$remoteFile".Replace("\", "/")
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $password)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    
    $fileBytes = [System.IO.File]::ReadAllBytes($localFile)
    $request.ContentLength = $fileBytes.Length
    
    $requestStream = $request.GetRequestStream()
    $requestStream.Write($fileBytes, 0, $fileBytes.Length)
    $requestStream.Close()
    
    $response = $request.GetResponse()
    $response.Close()
    Write-Host "Uploaded: $remoteFile"
}

# Helper function to delete a file
function Delete-FtpFile ($remoteFile) {
    $uri = "$ftpUrl/$remoteFile".Replace("\", "/")
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $password)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
    try {
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "Deleted: $remoteFile"
    } catch {
        # File might not exist, ignore error
    }
}

Write-Host "Starting deployment to Somee..."

# Step 1: Put application offline to unlock files
$offlineFile = Join-Path $localPath "app_offline.htm"
[System.IO.File]::WriteAllText($offlineFile, "<h1>KaiVet API is updating...</h1>")
Write-Host "Going offline..."
Upload-FtpFile $offlineFile "app_offline.htm"
Start-Sleep -Seconds 3

# Step 2: Create folders
$files = Get-ChildItem -Path $localPath -Recurse
$dirs = $files | Where-Object { $_.PSIsContainer } | Sort-Object FullName
foreach ($dir in $dirs) {
    $relPath = $dir.FullName.Substring($localPath.Length + 1).Replace("\", "/")
    Create-FtpDirectory $relPath
}

# Step 3: Upload files
$onlyFiles = $files | Where-Object { !$_.PSIsContainer }
foreach ($file in $onlyFiles) {
    $relPath = $file.FullName.Substring($localPath.Length + 1).Replace("\", "/")
    # Skip app_offline.htm here since we handle it manually
    if ($relPath -eq "app_offline.htm") { continue }
    try {
        Upload-FtpFile $file.FullName $relPath
    } catch {
        Write-Host "Error uploading ${relPath}: $_"
    }
}

# Step 4: Remove app_offline.htm to put app online
Write-Host "Going back online..."
Delete-FtpFile "app_offline.htm"

# Clean up local temporary file
if (Test-Path $offlineFile) { Remove-Item $offlineFile }

Write-Host "Deployment completed successfully!"
