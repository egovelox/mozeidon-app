export const Error = ({
  error,
  redirectCallback,
}: {
  error: string
  redirectCallback: () => void
}) => {
  return (
    <div className="container" style={{ padding: "1em" }}>
      <h4>😢 Error</h4>
      <div>
        <ul>
          <li>
            <b>An unexpected error occured</b>
          </li>
          <br />
          <li>
            <div>Details : </div>
            <div>
              <i>{error}</i>
            </div>
          </li>
        </ul>
      </div>
      <br />
      <h4>🙏 Resolution steps</h4>
      <div>
        <ul>
          <li>
            <div>Please be sure that a web-browser is currently running,</div>
            <div>
              and that the <b>mozeidon</b> browser-extension is installed and
              activated.
            </div>
          </li>
          <br />
          <li>
            <div>
              Please check that the native-manifest is correctly installed on
              your machine.
            </div>
            <div>
              See further details in{" "}
              <span id="errorSettingsLink" onClick={redirectCallback}>
                Settings
              </span>
            </div>
            <div>
              ( Host configuration <b>&gt;</b> Browsers and native-manifests )
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}
