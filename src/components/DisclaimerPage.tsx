export function DisclaimerPage() {
  return (
    <div className="max-w-2xl mx-auto w-full py-8 space-y-8 text-neutral-300 text-sm leading-relaxed">
      <h2 className="text-2xl font-semibold text-white">Disclaimer</h2>

      <section className="space-y-2">
        <h3 className="text-base font-medium text-white">Intended Use</h3>
        <p>
          Uncle's Table is an off-the-table GTO study and training tool. It is
          designed for reviewing preflop strategy and practicing decisions
          outside of live poker sessions. Do not use this tool during gameplay.
        </p>
        <p>
          Using third-party tools while playing may violate your poker
          platform's terms of service and result in account restrictions or
          permanent bans.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-medium text-white">Data Sources</h3>
        <p>
          Preflop range data is sourced from published GTO solver outputs and
          open-source chart packs. No proprietary solver data is used. Range
          data is provided as-is for educational purposes.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-medium text-white">No Real-Time Assistance</h3>
        <p>
          This application does not interact with any poker client. It does not
          read screen contents, intercept network traffic, overlay information
          during gameplay, or provide real-time decision assistance in any form.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-medium text-white">User Responsibility</h3>
        <p>
          Players are solely responsible for ensuring their use of any tools
          complies with the terms of service of their poker platform. The
          authors assume no liability for any consequences arising from the use
          of this application.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-medium text-white">Open Source</h3>
        <p>
          Uncle's Table is open source and built on top of{' '}
          <a
            href="https://github.com/AHTOOOXA/poker-charts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-200 underline underline-offset-2 hover:text-white"
          >
            AHTOOOXA/poker-charts
          </a>
          . Licensed under MIT.
        </p>
      </section>
    </div>
  )
}
