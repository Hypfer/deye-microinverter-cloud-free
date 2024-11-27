meta:
  id: deye_sun600

seq:
  - id: header
    type: header
  - id: payload
    size: header.payload_length
    type:
      switch-on: header.msg_type
      cases:
        "msg_type::handshake": handshake_msg_payload
        "msg_type::data": data_msg_payload
        "msg_type::wifi": wifi_msg_payload
        "msg_type::command": command_msg_payload
  - id: footer
    type: footer

types:
  header:
    seq:
      - id: magic
        contents: [0xa5]
      - id: payload_length
        type: u2le
      - id: unknown1
        type: u1
      - id: msg_type
        type: u1
        enum: msg_type
      - id: msg_id_response
        type: u1
      - id: msg_id_request
        type: u1
      - id: logger_sn
        type: u4le
  footer:
    seq:
      - id: checksum
        type: u1
      - id: magic
        contents: [0x15]
  
  command_msg_payload:
    seq:
      - size: 15
      - id: command
        type: str
        encoding: ASCII
        size-eos: true
  
  handshake_msg_payload:
    seq:
      - size: 13
      - size: 6
      - id: fw_ver
        type: str
        size: 40
        encoding: ASCII
      - size: 6
      - id: ip
        type: str
        size: 16
        encoding: ASCII
      - size: 8
      - id: version
        type: str
        size: 18
        encoding: ASCII
      - size: 65
      - id: ssid
        type: str
        size: 30
        encoding: ASCII
      - id: unknown
        size-eos: true

  data_msg_payload:
    seq:
      - id: payload_magic # Might be destination? 01 for logger, 02 for inverter, 129 for logger historic
        size: 1 # has to be carried over to the response
      - id: schema
        enum: data_msg_payload_schema
        type: u1
      - id: data
        size-eos: true
        type:
          switch-on: schema
          cases:
            "data_msg_payload_schema::microinverter": data_msg_payload_microinverter
            "data_msg_payload_schema::hybridinverter": data_msg_payload_hybridinverter
  
  data_msg_payload_hybridinverter:
    seq:
      - size: 1
      - id: unknown
        type: u4le
      - id: power_on_time
        type: u4le
      - id: unknown2
        type: u4le
      - size: 10
      - id: inverter_serial
        type: str
        size: 10
        encoding: ASCII
      - size: 6
      - id: some_string
        type: str
        size: 28
        encoding: ASCII
      - size: 26
      - id: energy_battery_charge_today
        type: s2be
      - id: energy_battery_discharge_today
        type: s2be
      - id: energy_battery_charge_total
        type: s4be
      - id: energy_battery_discharge_total
        type: s4be
      - id: energy_grid_import_today
        type: s2be
      - id: energy_grid_export_today
        type: s2be
      - id: energy_grid_import_total
        type: s4be
      - id: energy_grid_export_total
        type: s4be
      - id: energy_house_today
        type: s2be
      - id: energy_house_total
        type: s4be

      - size: 4

      - id: energy_pv_today
        type: s2be
      - id: energy_pv1_today # TODO
        type: s2be
      - id: energy_pv2_today # TODO
        type: s2be
      - id: energy_pv_total
        type: s4be

      - size: 34

      - id: battery_temp
        type: s2be
      - id: battery_voltage
        type: s2be
      - id: battery_soc_pct
        type: s2be
      - size: 2
      - id: battery_power
        type: s2be
      - id: battery_current
        type: s2be
      - id: battery_unknown 
        type: s2be

      - id: grid_l1_n_voltage
        type: s2be
      - id: grid_l2_n_voltage
        type: s2be
      - id: grid_l3_n_voltage
        type: s2be

      - size: 8

      - id: grid_l1_power
        type: s2be
      - id: grid_l2_power
        type: s2be
      - id: grid_l3_power
        type: s2be


  data_msg_payload_microinverter:
    seq:
      - size: 5
      - id: unknown_counter_1
        type: u2be
      - size: 8
      - id: unknown_counter_2
        type: u2le
      - size: 2
      - id: inverter_id
        size: 10
      - id: unknown2
        type: u2le
      - id: kwh_today
        type: u4le
      - id: kwh_total
        type: u4le
      - size: 4
      - id: grid_v
        type: u2le
      - size: 4
      - id: grid_i
        type: u2le
      - size: 4
      - id: grid_freq_hz
        type: u2le
      - id: grid_active_power_w
        type: u4le
      - id: inverter_radiator_temp_celsius
        type: s2le
      - size: 20
      - id: pv_1_v
        type: u2le
      - id: pv_1_i
        type: u2le
      - id: pv_2_v
        type: u2le
      - id: pv_2_i
        type: u2le
      - id: pv_3_v
        type: u2le
      - id: pv_3_i
        type: u2le
      - id: pv_4_v
        type: u2le
      - id: pv_4_i
        type: u2le
      - id: protocol_ver
        type: str
        size: 8
        encoding: ASCII
      - id: dc_master_fw_version
        type: str
        size: 8
        encoding: ASCII
      - id: ac_fw_version
        type: str
        size: 8
        encoding: ASCII
      - size: 4
      - id: inverter_rated_power_w
        type: u2be
      - id: mppt_count
        type: u1
      - id: phase_count
        type: u1
      - size: 3
      - id: pv_1_kwh_today
        type: u2le
      - id: pv_2_kwh_today
        type: u2le
      - id: pv_3_kwh_today
        type: u2le
      - id: pv_4_kwh_today
        type: u2le
      - size: 1
      - id: pv_1_kwh_total
        type: u2be
      - size: 2
      - id: pv_2_kwh_total
        type: u2be
      - size: 2
      - id: pv_3_kwh_total
        type: u2be
      - size: 2
      - id: pv_4_kwh_total
        type: u2be
      - id: pv_ids
        size: 64
      - id: grid_freq_hz_overfreq_load_reduction_starting_point
        type: u2be
      - id: grid_overfreq_load_reduction_percent
        type: u2be
      - size: 8
      - id: grid_v_limit_upper
        type: u2be
      - id: grid_v_limit_lower
        type: u2be
      - id: grid_freq_hz_limit_upper
        type: u2be
      - id: grid_freq_hz_limit_lower
        type: u2be
      - id: startup_self_check_time
        type: u2be
      - id: current_time
        size: 6
  
  
  wifi_msg_payload:
    seq:
      - id: schema
        enum: wifi_msg_payload_schema
        type: u1
      - id: maybe_uptime
        type: u2le
      - id: some_count
        type: u2le

      - id: maybe_connection_time_seconds
        type: u2le
      - id: unknown2
        type: u2le
      - id: unknown3
        type: u2le
      - id: unknown5
        type: u2le
      - id: unknown7
        type: u1
      - id: unknonw8
        type: u1
      - id: data
        size-eos: true
        type:
          switch-on: schema
          cases:
            "wifi_msg_payload_schema::foo": wifi_msg_payload_baz #intentional
            "wifi_msg_payload_schema::bar": wifi_msg_payload_bar
            "wifi_msg_payload_schema::baz": wifi_msg_payload_baz
  
  wifi_msg_payload_bar:
    seq:
      - id: inverter_sn
        size: 10
        type: str
        encoding: ASCII
      - id: data
        size-eos: true
  wifi_msg_payload_baz:
    seq:
      - id: ssid
        type: str
        size: 30
        encoding: ASCII
      - id: signal_quality_pct
        type: u1
      - id: some_constant
        contents: [0x01]


enums:
  msg_type:
    0x11: "handshake_response"
    0x12: "data_response"
    0x17: "heartbeat_response"
    0x41: "handshake"
    0x42: "data"
    0x43: "wifi"
    0x45: "command"
    0x47: "heartbeat"
  
  data_msg_payload_schema:
    0x08: "microinverter"
    0x11: "hybridinverter"
    0x13: "relaymodule"
  
  wifi_msg_payload_schema:
    0x01: "foo"
    0x04: "bar"
    0x81: "baz"
