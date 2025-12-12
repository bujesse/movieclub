'use client'

type RadialStatsProps = {
  total: number
  userSeen: number
  clubSeen: number
  anyoneSeen: number
}

export default function RadialStats({ total, userSeen, clubSeen, anyoneSeen }: RadialStatsProps) {
  // Calculate percentages
  const userPercent = total > 0 ? (userSeen / total) * 100 : 0
  const clubPercent = total > 0 ? (clubSeen / total) * 100 : 0
  const anyonePercent = total > 0 ? (anyoneSeen / total) * 100 : 0

  // SVG circle properties
  const size = 200
  const center = size / 2
  const strokeWidth = 14
  const gap = 5

  // Calculate radii for concentric circles (from inside out)
  const radius1 = 45 // innermost (club seen)
  const radius2 = radius1 + strokeWidth + gap // middle (user seen)
  const radius3 = radius2 + strokeWidth + gap // outermost (anyone seen)

  // Calculate circumference for each circle
  const circumference1 = 2 * Math.PI * radius1
  const circumference2 = 2 * Math.PI * radius2
  const circumference3 = 2 * Math.PI * radius3

  // Calculate dash offsets to create progress arcs
  const offset1 = circumference1 - (clubPercent / 100) * circumference1
  const offset2 = circumference2 - (userPercent / 100) * circumference2
  const offset3 = circumference3 - (anyonePercent / 100) * circumference3

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circles (gray) */}
        <circle
          cx={center}
          cy={center}
          r={radius3}
          fill="none"
          stroke="#333"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius2}
          fill="none"
          stroke="#333"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius1}
          fill="none"
          stroke="#333"
          strokeWidth={strokeWidth}
        />

        {/* Progress circles */}
        {/* Anyone seen (outermost) - light gray */}
        <circle
          cx={center}
          cy={center}
          r={radius3}
          fill="none"
          stroke="#dbdbdb"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference3}
          strokeDashoffset={offset3}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />

        {/* User seen (middle) - green/success */}
        <circle
          cx={center}
          cy={center}
          r={radius2}
          fill="none"
          stroke="#48c78e"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference2}
          strokeDashoffset={offset2}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />

        {/* Club seen (innermost) - teal/info */}
        <circle
          cx={center}
          cy={center}
          r={radius1}
          fill="none"
          stroke="#3e8ed0"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference1}
          strokeDashoffset={offset1}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />
      </svg>

      {/* Center text showing total */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', fontWeight: 'bold', lineHeight: 1 }}>{total}</div>
      </div>
    </div>
  )
}
