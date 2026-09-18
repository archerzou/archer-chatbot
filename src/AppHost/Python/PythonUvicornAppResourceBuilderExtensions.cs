namespace Aspire.Hosting;

public static class PythonUvicornAppResourceBuilderExtensions
{
    public static IResourceBuilder<PythonUvicornAppResource> AddPythonUvicornApp(this IDistributedApplicationBuilder builder, string name, string workingDirectory, int? port = default, int? targetPort = default)
    {
        // Resolve the workingDirectory (passed relative to the AppHost) to an absolute path so we can
        // point Aspire at the interpreter inside the project's local virtual environment (.venv). The
        // service has no Dockerfile - Aspire runs it as a local executable - so it must launch the
        // venv's Python (created from C:\python12) rather than a bare "python" resolved off PATH.
        var absoluteWorkingDirectory = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, workingDirectory));
        var venvPython = OperatingSystem.IsWindows()
            ? Path.Combine(absoluteWorkingDirectory, ".venv", "Scripts", "python.exe")
            : Path.Combine(absoluteWorkingDirectory, ".venv", "bin", "python");

        return builder.AddResource(new PythonUvicornAppResource(name, venvPython, absoluteWorkingDirectory))
            .WithArgs("-m", "uvicorn", "main:app")
            .WithHttpEndpoint(env: "UVICORN_PORT", port: port, targetPort: targetPort);
    }
}

public class PythonUvicornAppResource(string name, string command, string workingDirectory)
    : ExecutableResource(name, command, workingDirectory), IResourceWithServiceDiscovery
{
}
